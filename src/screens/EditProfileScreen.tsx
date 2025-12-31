/**
 * EDIT PROFILE SCREEN
 * 
 * Screen for editing user profile information.
 */

import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, ScrollView, StatusBar, StyleSheet, Switch, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Autocomplete, Avatar, Button, Card, Input, Text } from '../components/ui';
import { supabase } from '../config/supabase';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { updateProfile } from '../services/supabase/authService';
import { getAllOrganizations, searchOrganizations } from '../services/supabase/organizationsService';
import { hapticSelect, hapticSuccess } from '../utils/haptics';

export function EditProfileScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [showFullName, setShowFullName] = useState(user?.showFullName !== undefined ? user.showFullName : true);
  const [organization, setOrganization] = useState(user?.organization || '');
  const [rank, setRank] = useState(user?.rank || '');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const organizationSearchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);
  
  // Track original values
  const originalValuesRef = React.useRef({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    displayName: user?.displayName || '',
    showFullName: user?.showFullName !== undefined ? user.showFullName : true,
    organization: user?.organization || '',
    rank: user?.rank || '',
    location: user?.location || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatar,
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      const original = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName,
        showFullName: user.showFullName !== undefined ? user.showFullName : true,
        organization: user.organization || '',
        rank: user.rank || '',
        location: user.location || '',
        bio: user.bio || '',
        avatarUrl: user.avatar,
      };
      
      setFirstName(original.firstName);
      setLastName(original.lastName);
      setDisplayName(original.displayName);
      setShowFullName(original.showFullName);
      setOrganization(original.organization);
      setRank(original.rank);
      setLocation(original.location);
      setBio(original.bio);
      setAvatarUrl(original.avatarUrl);
      
      originalValuesRef.current = original;
    }
  }, [user]);
  
  // Update displayName preview when showFullName, firstName, or lastName changes
  useEffect(() => {
    if (firstName && lastName) {
      if (showFullName) {
        // Full name: "FirstName LastName"
        setDisplayName(`${firstName.trim()} ${lastName.trim()}`.trim());
      } else {
        // Abbreviated: "FirstName LastInitial."
        const lastInitial = lastName.trim().charAt(0).toUpperCase();
        setDisplayName(`${firstName.trim()} ${lastInitial}.`.trim());
      }
    } else if (firstName) {
      setDisplayName(firstName.trim());
    } else if (lastName) {
      if (showFullName) {
        setDisplayName(lastName.trim());
      } else {
        setDisplayName(`${lastName.trim().charAt(0).toUpperCase()}.`);
      }
    }
  }, [firstName, lastName, showFullName]);

  // Check for changes
  useEffect(() => {
    const current = {
      firstName,
      lastName,
      displayName,
      showFullName,
      organization,
      rank,
      location,
      bio,
      avatarUrl,
    };
    
    const hasFormChanges = 
      current.firstName !== originalValuesRef.current.firstName ||
      current.lastName !== originalValuesRef.current.lastName ||
      current.showFullName !== originalValuesRef.current.showFullName ||
      current.organization !== originalValuesRef.current.organization ||
      current.rank !== originalValuesRef.current.rank ||
      current.location !== originalValuesRef.current.location ||
      current.bio !== originalValuesRef.current.bio ||
      current.avatarUrl !== originalValuesRef.current.avatarUrl;
    
    setHasChanges(hasFormChanges);
  }, [firstName, lastName, displayName, showFullName, organization, rank, location, bio, avatarUrl]);

  // Load all organizations when field is focused
  const handleOrganizationFocus = async () => {
    if (organizations.length === 0) {
      try {
        const allOrgs = await getAllOrganizations();
        setOrganizations(allOrgs);
      } catch (error) {
        console.warn('Could not load organizations:', error);
      }
    }
  };

  // Handle organization search
  const handleOrganizationChange = async (text: string) => {
    setOrganization(text);
    
    // Clear previous timeout
    if (organizationSearchTimeoutRef.current) {
      clearTimeout(organizationSearchTimeoutRef.current);
    }
    
    if (text.trim().length >= 2) {
      // Debounce organization search
      organizationSearchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchOrganizations(text.trim());
          setOrganizations(results);
        } catch (error) {
          console.warn('Could not search organizations:', error);
        }
      }, 300);
    } else if (text.trim().length === 0) {
      // If field is cleared, reload all organizations
      try {
        const allOrgs = await getAllOrganizations();
        setOrganizations(allOrgs);
      } catch (error) {
        console.warn('Could not load organizations:', error);
      }
    }
  };

  const handleOrganizationSelect = (selectedOrg: string) => {
    setOrganization(selectedOrg);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (organizationSearchTimeoutRef.current) {
        clearTimeout(organizationSearchTimeoutRef.current);
      }
    };
  }, []);

  const handleAvatarPick = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.permissionRequired'),
          t('profile.photoPermissionRequired')
        );
        return;
      }

      // Show options: camera or library
      Alert.alert(
        t('profile.selectAvatarSource'),
        '',
        [
          {
            text: t('profile.takePhoto'),
            onPress: async () => {
              const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraStatus.status !== 'granted') {
                Alert.alert(
                  t('common.permissionRequired'),
                  t('profile.cameraPermissionRequired')
                );
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled) {
                await uploadAvatar(result.assets[0].uri);
              }
            },
          },
          {
            text: t('profile.chooseFromLibrary'),
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled) {
                await uploadAvatar(result.assets[0].uri);
              }
            },
          },
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('errors.generic'), t('profile.avatarUploadError'));
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      // Read file as base64 using expo-file-system
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });

      // Determine file extension and MIME type
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileExt === 'png' ? 'image/png' : fileExt === 'jpeg' || fileExt === 'jpg' ? 'image/jpeg' : 'image/jpeg';
      
      // Create file name
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Convert base64 to ArrayBuffer
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const arrayBuffer = byteArray.buffer;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await updateProfile({ avatar: publicUrl });
      setAvatarUrl(publicUrl);

      // Refresh user data
      await refreshUser();
      hapticSuccess();

      Alert.alert(t('common.success'), t('profile.avatarUpdateSuccess'));
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      const errorMessage = error?.message || t('profile.avatarUploadError');
      Alert.alert(t('errors.generic'), errorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user || !avatarUrl) return;

    Alert.alert(
      t('profile.deleteAvatar'),
      t('profile.deleteAvatarConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.deleteAvatar'),
          style: 'destructive',
          onPress: async () => {
            setUploadingAvatar(true);
            try {
              // Extract file path from avatar URL
              // URL format: https://[project].supabase.co/storage/v1/object/public/avatars/[path]
              const urlParts = avatarUrl.split('/avatars/');
              if (urlParts.length > 1) {
                const filePath = urlParts[1];
                
                // Delete file from Supabase storage
                const { error: deleteError } = await supabase.storage
                  .from('avatars')
                  .remove([filePath]);
                
                if (deleteError) {
                  console.warn('Failed to delete avatar from storage:', deleteError);
                  // Continue with profile update even if storage delete fails
                }
              }

              // Update profile with null avatar to delete it
              await updateProfile({ avatar: null as any });
              setAvatarUrl(undefined);

              // Refresh user data
              await refreshUser();
              hapticSuccess();

              Alert.alert(t('common.success'), t('profile.avatarDeleteSuccess'));
            } catch (error: any) {
              console.error('Avatar delete failed:', error);
              Alert.alert(t('errors.generic'), t('profile.avatarDeleteError'));
            } finally {
              setUploadingAvatar(false);
            }
          },
        },
      ]
    );
  };

  // Create or get unit by name (silently in background)
  const createOrGetUnit = async (unitName: string): Promise<string | null> => {
    if (!unitName || !unitName.trim()) return null;
    
    try {
      // First, check if unit already exists
      const { data: existingUnit, error: searchError } = await supabase
        .from('units')
        .select('id')
        .eq('name', unitName.trim())
        .single();
      
      if (existingUnit && !searchError) {
        return existingUnit.id;
      }
      
      // Unit doesn't exist, create it silently
      const { data: newUnit, error: createError } = await supabase
        .from('units')
        .insert({
          name: unitName.trim(),
        })
        .select('id')
        .single();
      
      if (createError) {
        // If creation fails (e.g., duplicate key), try to get it again
        const { data: retryUnit } = await supabase
          .from('units')
          .select('id')
          .eq('name', unitName.trim())
          .single();
        
        if (retryUnit) {
          return retryUnit.id;
        }
        
        console.warn('Could not create unit:', createError);
        return null;
      }
      
      return newUnit?.id || null;
    } catch (error) {
      console.warn('Error creating/getting unit:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user || !hasChanges) return;
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    setSaving(true);
    try {
      // If organization is provided, create or get the unit silently
      let unitId = user.unitId;
      if (organization && organization.trim()) {
        const createdUnitId = await createOrGetUnit(organization.trim());
        if (createdUnitId) {
          unitId = createdUnitId;
        }
      }
      
      await updateProfile({
        firstName,
        lastName,
        showFullName,
        organization,
        rank,
        location,
        bio,
        avatar: avatarUrl,
        unitId,
      });
      
      // Update original values
      originalValuesRef.current = {
        firstName,
        lastName,
        displayName: user.displayName, // Keep current displayName (will be updated by trigger)
        showFullName,
        organization,
        rank,
        location,
        bio,
        avatarUrl,
      };
      
      // Refresh user data from Supabase
      await refreshUser();
      
      setHasChanges(false);
      hapticSuccess();
      
      // Show success and navigate back
      setTimeout(() => {
        Alert.alert(t('common.success'), t('profile.updateSuccess'), [
          { text: t('common.ok'), onPress: () => router.back() }
        ]);
      }, 100);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert(t('errors.generic'), t('profile.updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.gradientStart} translucent={true} />
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text variant="headingLarge" style={{ color: '#FFFFFF' }}>{t('profile.edit')}</Text>
      </LinearGradient>
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: theme.spacing.xxl + insets.bottom + 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Avatar Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="image-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('profile.profilePicture')}</Text>
          </View>
          
          <Card style={styles.avatarCard} glass>
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <Avatar size={120} name={displayName} imageUrl={avatarUrl} />
                {uploadingAvatar && (
                  <View style={styles.avatarUploadOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.avatarEditButton}
                  onPress={handleAvatarPick}
                  disabled={uploadingAvatar}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={uploadingAvatar ? "hourglass" : "camera"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.avatarInfo}>
                <Text variant="caption" color="textSecondary" style={styles.avatarHint}>
                  {t('profile.avatarHint')}
                </Text>
              </View>
              <View style={styles.avatarButtonsRow}>
                <TouchableOpacity
                  onPress={handleAvatarPick}
                  disabled={uploadingAvatar}
                  style={styles.avatarTextButton}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={uploadingAvatar ? "hourglass-outline" : "pencil-outline"} 
                    size={16} 
                    color={theme.colors.primary} 
                  />
                  <Text variant="body" color="primary" style={styles.avatarButtonText}>
                    {uploadingAvatar ? t('common.uploading') : t('profile.editAvatar')}
                  </Text>
                </TouchableOpacity>
                
                {avatarUrl && (
                  <TouchableOpacity
                    onPress={handleDeleteAvatar}
                    disabled={uploadingAvatar}
                    style={styles.avatarDeleteButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="trash-outline" 
                      size={16} 
                      color={theme.colors.error} 
                    />
                    <Text variant="body" style={[styles.avatarButtonText, { color: theme.colors.error }]}>
                      {t('profile.deleteAvatar')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Card>
        </View>
        
        {/* Personal Information Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('profile.personalInfo')}</Text>
          </View>
          
          <Card style={styles.sectionCard} glass>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Input
                  label={t('profile.firstName')}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={t('profile.firstNamePlaceholder')}
                />
              </View>
              <View style={styles.nameField}>
                <Input
                  label={t('profile.lastName')}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={t('profile.lastNamePlaceholder')}
                />
              </View>
            </View>
            
            <View style={[styles.divider, { marginVertical: theme.spacing.md }]} />
            
            {/* Display Name Setting - Toggle and Preview */}
            <View style={styles.displayNameSetting}>
              <View style={styles.displayNameSettingHeader}>
                <Text variant="label" color="textSecondary" style={styles.displayNameSettingLabel}>
                  {t('profile.displayName')}
                </Text>
              </View>
              
              {/* Show Full Name Toggle */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <View style={styles.switchTextContainer}>
                    <Text variant="body">{t('profile.showFullName')}</Text>
                    <Text variant="caption" color="textSecondary" style={styles.switchHint}>
                      {t('profile.showFullNameHint')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={showFullName}
                  onValueChange={(value) => {
                    hapticSelect();
                    setShowFullName(value);
                  }}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={showFullName ? theme.colors.onPrimary : theme.colors.surface}
                  ios_backgroundColor={theme.colors.border}
                />
              </View>
              
              {/* Display Name Preview */}
              <View style={styles.displayNamePreview}>
                <Text variant="caption" color="textTertiary" style={styles.previewLabel}>
                  {t('profile.displayNamePreview')}
                </Text>
                <View style={styles.previewValue}>
                  <Text variant="body" style={styles.previewText}>
                    {displayName || t('profile.displayNamePlaceholder')}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
        
        {/* Professional Information Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('profile.professionalInfo')}</Text>
          </View>
          
          <Card style={styles.sectionCard} glass>
            <View style={styles.fieldHint}>
              <Ionicons name="information-circle-outline" size={16} color={theme.colors.textTertiary} />
              <Text variant="caption" color="textTertiary" style={styles.hintText}>
                {t('profile.professionalInfoHint')}
              </Text>
            </View>
            
            <View style={styles.inputWithIcon}>
              <View style={[styles.inputIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Ionicons name="business-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.inputWithIconContent}>
                <Autocomplete
                  label={t('profile.organization')}
                  value={organization}
                  onChangeText={handleOrganizationChange}
                  onSelect={handleOrganizationSelect}
                  onFocus={handleOrganizationFocus}
                  placeholder={t('profile.organizationPlaceholder')}
                  data={organizations}
                  minCharsToSearch={0}
                  maxSuggestions={10}
                />
                <Text variant="caption" color="textTertiary" style={styles.fieldHintText}>
                  {t('profile.organizationHint')}
                </Text>
              </View>
            </View>
            
            <View style={[styles.divider, { marginVertical: theme.spacing.md }]} />
            
            <View style={styles.inputWithIcon}>
              <View style={[styles.inputIcon, { backgroundColor: `${theme.colors.info}15` }]}>
                <Ionicons name="ribbon-outline" size={18} color={theme.colors.info} />
              </View>
              <View style={styles.inputWithIconContent}>
                <Input
                  label={t('profile.rank')}
                  value={rank}
                  onChangeText={setRank}
                  placeholder={t('profile.rankPlaceholder')}
                />
              </View>
            </View>
            
            <View style={[styles.divider, { marginVertical: theme.spacing.md }]} />
            
            <View style={styles.inputWithIcon}>
              <View style={[styles.inputIcon, { backgroundColor: `${theme.colors.success}15` }]}>
                <Ionicons name="location-outline" size={18} color={theme.colors.success} />
              </View>
              <View style={styles.inputWithIconContent}>
                <Input
                  label={t('profile.location')}
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t('profile.locationPlaceholder')}
                />
              </View>
            </View>
          </Card>
        </View>
        
        {/* Bio Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            <Text variant="headingSmall">{t('profile.bio')}</Text>
          </View>
          
          <Card style={styles.sectionCard} glass>
            <View style={styles.bioSection}>
              <View style={[styles.bioIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.bioInputContainer}>
                <Input
                  value={bio}
                  onChangeText={setBio}
                  placeholder={t('profile.bioPlaceholder')}
                  multiline
                  numberOfLines={4}
                  style={styles.bioInput}
                  maxLength={500}
                />
                <View style={styles.bioFooter}>
                  <Text variant="caption" color="textTertiary" style={styles.bioHint}>
                    {t('profile.bioHint')}
                  </Text>
                  <Text variant="caption" color="textTertiary" style={styles.bioCounter}>
                    {bio.length}/500
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
        
        {/* Save Status Indicator */}
        {saving && (
          <View style={styles.saveIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="caption" color="textSecondary" style={{ marginLeft: theme.spacing.sm }}>
              {t('common.saving')}...
            </Text>
          </View>
        )}
        
        {/* Save Button */}
        <Button
          variant="primary"
          onPress={handleSave}
          disabled={saving || !hasChanges}
          style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
        >
          <View style={styles.saveButtonContent}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons 
                name={hasChanges ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={20} 
                color="#FFFFFF" 
              />
            )}
            <Text variant="body" style={styles.saveButtonText}>
              {saving ? t('common.saving') : hasChanges ? t('common.save') : t('profile.noChanges')}
            </Text>
          </View>
        </Button>
      </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingTop: 60, // Extra padding for status bar + spacing
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      gap: theme.spacing.xl,
      paddingBottom: theme.spacing.xxl,
    },
    sectionContainer: {
      gap: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    avatarCard: {
      padding: theme.spacing.lg,
    },
    avatarSection: {
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatarUploadOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 60,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarEditButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      borderWidth: 3,
      borderColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    avatarInfo: {
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    avatarHint: {
      textAlign: 'center',
    },
    avatarButtonsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    avatarTextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: `${theme.colors.primary}10`,
    },
    avatarDeleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: `${theme.colors.error}10`,
    },
    avatarButtonText: {
      fontWeight: '600',
    },
    sectionCard: {
      padding: theme.spacing.lg,
    },
    nameRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    nameField: {
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    inputIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.xs,
    },
    inputWithIconContent: {
      flex: 1,
    },
    professionalRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    professionalField: {
      flex: 1,
    },
    bioSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    bioIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.xs,
    },
    bioInputContainer: {
      flex: 1,
    },
    bioInput: {
      marginBottom: theme.spacing.xs,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    bioHint: {
      flex: 1,
    },
    bioFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    bioCounter: {
      marginLeft: theme.spacing.sm,
    },
    fieldHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.md,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
    },
    hintText: {
      flex: 1,
    },
    fieldHintText: {
      marginTop: theme.spacing.xs,
    },
    displayNameSetting: {
      marginTop: theme.spacing.sm,
    },
    displayNameSettingHeader: {
      marginBottom: theme.spacing.sm,
    },
    displayNameSettingLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
    },
    displayNamePreview: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    previewLabel: {
      marginBottom: theme.spacing.xs,
    },
    previewValue: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    previewText: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSize.base,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    switchLabel: {
      flex: 1,
      alignItems: 'flex-start',
    },
    switchTextContainer: {
      flex: 1,
    },
    switchHint: {
      marginTop: theme.spacing.xxs,
    },
    saveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    saveButton: {
      marginTop: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: theme.spacing.md,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    saveButtonDisabled: {
      opacity: 0.5,
      shadowOpacity: 0.1,
    },
    saveButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: theme.typography.fontSize.base,
    },
  });
}

