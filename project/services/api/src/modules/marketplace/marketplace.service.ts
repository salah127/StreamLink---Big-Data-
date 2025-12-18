import { Injectable, NotFoundException } from '@nestjs/common';
import { config } from '@streamlink/config';
import Stripe from 'stripe';
import { PrismaService } from '../../common/prisma/prisma.service';

type ProductRecord = {
  id: string;
  streamerId: string;
  currency: string;
  price: number;
  title: string;
  description?: string | null;
  isActive?: boolean;
};

@Injectable()
export class MarketplaceService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  // Products
  async getProducts(streamerId: string, isActive?: boolean) {
    return this.prisma.product.findMany({
      where: {
        streamerId,
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(streamerId: string, data: { title: string; description?: string; price: number; currency?: string }) {
    return this.prisma.product.create({
      data: {
        ...data,
        streamerId,
      },
    });
  }

  async updateProduct(streamerId: string, productId: string, data: { title?: string; description?: string; price?: number; isActive?: boolean }) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, streamerId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data,
    });
  }

  async deleteProduct(streamerId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, streamerId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  // Orders
  async createOrder(buyerId: string, productId: string) {
    const product = (await this.prisma.product.findUnique({
      where: { id: productId },
    })) as ProductRecord | null;

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or inactive');
    }

    // Create Stripe checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.title,
              description: product.description || undefined,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/cancel`,
      metadata: {
        productId: product.id,
        streamerId: product.streamerId,
        buyerId,
      },
    };

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    // Create order record
    const order = await this.prisma.order.create({
      data: {
        streamerId: product.streamerId,
        buyerId,
        productId: product.id,
        amount: product.price,
        currency: product.currency,
        stripeSessionId: session.id,
        status: 'PENDING',
      },
    });

    return {
      order,
      checkoutUrl: session.url ?? '',
    };
  }

  async getOrders(userId: string, role: 'buyer' | 'seller') {
    return this.prisma.order.findMany({
      where: role === 'buyer' ? { buyerId: userId } : { streamerId: userId },
      include: {
        product: {
          select: {
            title: true,
            description: true,
          },
        },
        streamer: {
          select: {
            displayName: true,
            avatarUrl: true,
          },
        },
        buyer: {
          select: {
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Update order status
        await this.prisma.order.updateMany({
          where: { stripeSessionId: session.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        break;
      }

      case 'checkout.session.expired': {
        const expiredSession = event.data.object as Stripe.Checkout.Session;

        await this.prisma.order.updateMany({
          where: { stripeSessionId: expiredSession.id },
          data: { status: 'FAILED' },
        });

        break;
      }
    }
  }
}