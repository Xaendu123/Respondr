/**
 * EXPO CONFIG PLUGIN: Development Team, Build Number, Display Name & Platform Restrictions
 * 
 * Ensures the iOS development team, build number, and display name are always set in the Xcode project.
 * Also disables Mac and Vision Pro support to restrict to iPhone/iPad only.
 */

const { withXcodeProject, withInfoPlist, withPlugins } = require('@expo/config-plugins');

function withInfoPlistDisplayName(config) {
  return withInfoPlist(config, (config) => {
    const displayName = config.ios?.infoPlist?.CFBundleDisplayName || 
                       config.ios?.infoPlist?.CFBundleName || 
                       config.name || 
                       'Respondr';
    
    if (!config.modResults.CFBundleDisplayName) {
      config.modResults.CFBundleDisplayName = displayName;
    }
    return config;
  });
}

function withXcodeBuildSettings(config) {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const developmentTeam = config.ios?.developmentTeam; // Only set if provided
    const buildNumber = config.ios?.buildNumber || '1';
    const version = config.version || '1.0.0';
    const displayName = config.ios?.infoPlist?.CFBundleDisplayName || 
                       config.ios?.infoPlist?.CFBundleName || 
                       config.name || 
                       'Respondr';

    // Get all build configurations
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    
    Object.keys(configurations).forEach((configUuid) => {
      const buildSettings = configurations[configUuid].buildSettings;
      
      if (!buildSettings) return;
      
      // Match by bundle identifier or product name
      const isMainTarget = 
        buildSettings.PRODUCT_BUNDLE_IDENTIFIER === 'ch.respondr.app' ||
        buildSettings.PRODUCT_NAME === 'respondr' ||
        (buildSettings.PRODUCT_NAME && buildSettings.PRODUCT_NAME.toLowerCase().includes('respondr'));
      
      if (isMainTarget) {
        // Set development team (only if provided - don't force a default)
        if (developmentTeam) {
          buildSettings.DEVELOPMENT_TEAM = developmentTeam;
        }
        
        // Set build number (CURRENT_PROJECT_VERSION)
        buildSettings.CURRENT_PROJECT_VERSION = buildNumber;
        
        // Set version (MARKETING_VERSION)
        buildSettings.MARKETING_VERSION = version;
        
        // Set display name (INFOPLIST_KEY_CFBundleDisplayName)
        buildSettings.INFOPLIST_KEY_CFBundleDisplayName = displayName;
        
        // Disable Mac Catalyst support
        buildSettings.SUPPORTS_MACCATALYST = 'NO';
        buildSettings.SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = 'NO';
        
        // Disable Vision Pro support
        buildSettings.SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD = 'NO';
        
        // Ensure only iPhone and iPad are supported
        buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"'; // 1 = iPhone, 2 = iPad
      }
    });

    if (developmentTeam) {
      console.log(`✅ Development team set to: ${developmentTeam}`);
    }
    console.log(`✅ Build number set to: ${buildNumber}`);
    console.log(`✅ Version set to: ${version}`);
    console.log(`✅ Display name set to: ${displayName}`);
    console.log('✅ Mac and Vision Pro support disabled');

    return config;
  });
}

module.exports = function withDevelopmentTeam(config) {
  return withPlugins(config, [
    withInfoPlistDisplayName,
    withXcodeBuildSettings,
  ]);
};

