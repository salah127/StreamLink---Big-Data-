import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, theme } from '@streamlink/ui';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { IoniconName, ProfileSection } from '../../../src/features/profile/sections';
import { useAuthStore } from '../../../src/store/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const navigateToSection = useCallback(
    (section: ProfileSection) => {
      const href = `/(tabs)/profile/${section}` as const;
      router.push(href as never);
    },
    [router]
  );

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/onboarding');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In real app, this would call api.deleteAccount
            console.log('Delete account');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Card style={styles.profileCard} variant="elevated">
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={theme.colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>
                {user?.displayName || 'User'}
              </Text>
              <Text style={styles.email}>{user?.email}</Text>
              <Badge
                label={user?.role || 'VIEWER'}
                variant="primary"
                size="small"
                style={styles.roleBadge}
              />
            </View>
          </View>
          <Button
            title="Edit Profile"
            variant="outline"
            size="small"
            onPress={() => navigateToSection('edit')}
          />
        </Card>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <SettingsItem
            icon="notifications"
            title="Notifications"
            description="Manage your notification preferences"
            onPress={() => navigateToSection('notifications')}
          />

          <SettingsItem
            icon="link"
            title="Linked Accounts"
            description="Connect your streaming platforms"
            onPress={() => navigateToSection('linked-accounts')}
          />

          <SettingsItem
            icon="shield-checkmark"
            title="Privacy & Security"
            description="Manage your privacy settings"
            onPress={() => navigateToSection('privacy-security')}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>

          <SettingsItem
            icon="color-palette"
            title="Theme"
            description="Dark theme (default)"
            onPress={() => navigateToSection('theme')}
          />

          <SettingsItem
            icon="language"
            title="Language"
            description="English"
            onPress={() => navigateToSection('language')}
          />

          <SettingsItem
            icon="help-circle"
            title="Help & Support"
            description="Get help and contact support"
            onPress={() => navigateToSection('help-support')}
          />
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <SettingsItem
            icon="download"
            title="Export Data"
            description="Download your account data"
            onPress={() => navigateToSection('export-data')}
          />

          <SettingsItem
            icon="document-text"
            title="Privacy Policy"
            description="Read our privacy policy"
            onPress={() => navigateToSection('privacy-policy')}
          />

          <SettingsItem
            icon="document"
            title="Terms of Service"
            description="Read our terms of service"
            onPress={() => navigateToSection('terms-of-service')}
          />
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleLogout}
            style={styles.actionButton}
          />

          <Button
            title="Delete Account"
            variant="outline"
            onPress={handleDeleteAccount}
            style={[styles.actionButton, styles.dangerButton]}
            textStyle={styles.dangerButtonText}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>StreamLink v1.0.0</Text>
          <Text style={styles.copyright}>© 2024 StreamLink. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const SettingsItem = ({
  icon,
  title,
  description,
  onPress,
}: {
  icon: IoniconName;
  title: string;
  description: string;
  onPress: () => void;
}) => (
  <Button
    title=""
    variant="ghost"
    onPress={onPress}
    style={styles.settingsItem}
  >
    <View style={styles.settingsItemContent}>
      <Ionicons name={icon} size={24} color={theme.colors.textSecondary} />
      <View style={styles.settingsItemText}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        <Text style={styles.settingsItemDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
    </View>
  </Button>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: theme.spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  email: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  roleBadge: {
    alignSelf: 'flex-start',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.md,
  },
  settingsItem: {
    paddingHorizontal: 0,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  settingsItemText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  settingsItemTitle: {
    ...theme.typography.body,
    marginBottom: theme.spacing.xs,
  },
  settingsItemDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
  dangerButton: {
    borderColor: theme.colors.error,
  },
  dangerButtonText: {
    color: theme.colors.error,
  },
  appInfo: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  appVersion: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  copyright: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
