import { setStatusBarStyle } from 'expo-status-bar'
import { useFocusEffect } from 'expo-router'
import { Building2, Camera, Moon, UserRound } from 'lucide-react-native'
import { useCallback, useState, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatedBottomSheet } from '@/components/motion/surfaces'
import { AppButton } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useProfileAvatar } from '@/features/profile/use-profile-avatar'
import { radii, shadows, spacing, TAB_BAR_CLEARANCE, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function ProfileScreen() {
  const { user, organization, logout, isLoggingOut } = useAuth()
  const { colors, fonts, mode, toggleMode } = useAppTheme()
  const insets = useSafeAreaInsets()
  const avatar = useProfileAvatar(user?.id)
  const [sheetOpen, setSheetOpen] = useState(false)

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(mode === 'dark' ? 'light' : 'dark')
      return undefined
    }, [mode]),
  )

  const closeSheet = () => setSheetOpen(false)

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_CLEARANCE + spacing.lg }]}
      >
        <Text style={[styles.pageTitle, { color: colors.text, fontFamily: fonts.displayBold }]}>Profile</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary, fontFamily: fonts.body }]}>
          Your account and workspace details
        </Text>

        <View style={[styles.identity, { backgroundColor: colors.deepNavy }, shadows.card]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={avatar.hasPhoto ? 'Change profile photo' : 'Add profile photo'}
            onPress={() => setSheetOpen(true)}
            disabled={avatar.busy}
            style={styles.avatarPress}
          >
            <UserAvatar name={user?.displayName} uri={avatar.uri} size={72} />
            <View style={[styles.cameraBadge, { backgroundColor: colors.teal, borderColor: colors.deepNavy }]}>
              {avatar.busy ? <ActivityIndicator color={colors.white} size="small" /> : <Camera size={14} color={colors.white} />}
            </View>
          </Pressable>
          <View style={styles.identityCopy}>
            <Text style={[styles.name, { color: colors.heroText, fontFamily: fonts.display }]} numberOfLines={1}>
              {user?.displayName}
            </Text>
            <Text style={[styles.email, { color: colors.heroMuted, fontFamily: fonts.body }]} numberOfLines={1}>
              {user?.email}
            </Text>
            <Text style={[styles.roleLine, { color: colors.tealHighlight, fontFamily: fonts.bodySemibold }]} numberOfLines={1}>
              {[user?.roleLabel, user?.department].filter(Boolean).join(' · ')}
            </Text>
            <Pressable onPress={() => setSheetOpen(true)} hitSlop={8}>
              <Text style={[styles.photoAction, { color: colors.gold, fontFamily: fonts.bodySemibold }]}>
                {avatar.hasPhoto ? 'Change photo' : 'Upload photo'}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedText, fontFamily: fonts.bodySemibold }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}>
          <InfoRow
            icon={<UserRound size={18} color={colors.deepTeal} />}
            label="Role"
            value={user?.roleLabel}
            detail={user?.department}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow
            icon={<Building2 size={18} color={colors.deepTeal} />}
            label="Organization"
            value={organization?.name}
            detail={organization?.shortName}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
              <Moon size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowLabel, { color: colors.mutedText, fontFamily: fonts.bodyMedium }]}>Appearance</Text>
              <Text style={[styles.rowValue, { color: colors.text, fontFamily: fonts.bodySemibold }]}>
                {mode === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </View>
            <Switch
              accessibilityLabel="Use dark theme"
              value={mode === 'dark'}
              onValueChange={toggleMode}
              trackColor={{ false: colors.border, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton title="Sign out" variant="outline" onPress={() => logout()} loading={isLoggingOut} />
          <Text style={[styles.caption, { color: colors.mutedText, fontFamily: fonts.body }]}>
            Saru Flow · photo is saved on this device
          </Text>
        </View>
      </ScrollView>

      <AnimatedBottomSheet visible={sheetOpen} onClose={closeSheet} title="Profile photo">
        <Text style={[styles.sheetHint, { color: colors.textSecondary, fontFamily: fonts.body }]}>
          Choose a clear photo. It stays on this device until you change or remove it.
        </Text>
        <AppButton
          title="Choose from library"
          onPress={() => {
            closeSheet()
            void avatar.pickFromLibrary()
          }}
          disabled={avatar.busy}
        />
        <AppButton
          title="Take a photo"
          variant="outline"
          onPress={() => {
            closeSheet()
            void avatar.takePhoto()
          }}
          disabled={avatar.busy}
        />
        {avatar.hasPhoto ? (
          <AppButton
            title="Remove photo"
            variant="ghost"
            onPress={() => {
              closeSheet()
              void avatar.removePhoto()
            }}
            disabled={avatar.busy}
          />
        ) : null}
      </AnimatedBottomSheet>
    </View>
  )
}

function InfoRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode
  label: string
  value?: string | null
  detail?: string | null
}) {
  const { colors, fonts } = useAppTheme()
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: colors.tealHighlight }]}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, { color: colors.mutedText, fontFamily: fonts.bodyMedium }]}>{label}</Text>
        {value ? (
          <Text style={[styles.rowValue, { color: colors.text, fontFamily: fonts.bodySemibold }]} numberOfLines={2}>
            {value}
          </Text>
        ) : null}
        {detail ? (
          <Text style={[styles.rowDetail, { color: colors.textSecondary, fontFamily: fonts.body }]} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  pageTitle: { ...typography.screenTitle },
  pageSubtitle: { ...typography.body, marginTop: -spacing.xs },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  avatarPress: { position: 'relative' },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: { flex: 1, gap: 2, minWidth: 0 },
  name: { fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  email: { ...typography.meta },
  roleLine: { ...typography.label, marginTop: 2 },
  photoAction: { ...typography.label, marginTop: spacing.xs },
  sectionLabel: {
    ...typography.meta,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: 2, minWidth: 0 },
  rowLabel: { ...typography.meta },
  rowValue: { ...typography.cardTitle },
  rowDetail: { ...typography.meta },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md + 40 + spacing.sm,
    marginRight: spacing.md,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  caption: { ...typography.meta, textAlign: 'center' },
  sheetHint: { ...typography.body },
})
