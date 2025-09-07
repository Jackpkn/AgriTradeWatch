<Modal
visible={showSettingsModal}
transparent={true}
animationType="slide"
onRequestClose={() => setShowSettingsModal(false)}
>
<View style={styles.modalOverlay}>
  <View style={[styles.modalContent, styles.bottomSheetStyle]}>
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>Settings</Text>
      <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
        <Icon name="close" size={24} color="#666" />
      </TouchableOpacity>
    </View>
    
    <ScrollView style={styles.modalList}>
      {/* App Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>App Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="moon" size={20} color="#9C27B0" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Switch to dark theme</Text>
          </View>
          <View style={[
            styles.toggleSwitch,
            { backgroundColor: darkMode ? "#49A760" : "#ddd" }
          ]}>
            <View style={[
              styles.toggleCircle,
              { transform: [{ translateX: darkMode ? 18 : 0 }] }
            ]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="sync" size={20} color="#4A90E2" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Auto Data Sync</Text>
            <Text style={styles.settingDescription}>Sync data automatically</Text>
          </View>
          <View style={[
            styles.toggleSwitch,
            { backgroundColor: dataSync ? "#49A760" : "#ddd" }
          ]}>
            <View style={[
              styles.toggleCircle,
              { transform: [{ translateX: dataSync ? 18 : 0 }] }
            ]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="location" size={20} color="#FF9800" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Auto Location</Text>
            <Text style={styles.settingDescription}>Use current location automatically</Text>
          </View>
          <View style={[
            styles.toggleSwitch,
            { backgroundColor: autoLocation ? "#49A760" : "#ddd" }
          ]}>
            <View style={[
              styles.toggleCircle,
              { transform: [{ translateX: autoLocation ? 18 : 0 }] }
            ]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Data & Privacy */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Data & Privacy</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="download" size={20} color="#49A760" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Export Data</Text>
            <Text style={styles.settingDescription}>Download your data</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#49A760" />
        </TouchableOpacity>

                         <TouchableOpacity style={styles.settingItem}>
           <View style={styles.settingIcon}>
             <Icon name="trash" size={20} color="#ff4757" />
           </View>
           <View style={styles.settingContent}>
             <Text style={styles.settingLabel}>Clear Cache</Text>
             <Text style={styles.settingDescription}>Free up storage space</Text>
           </View>
           <Icon name="chevron-forward" size={20} color="#49A760" />
         </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="shield-checkmark" size={20} color="#4CAF50" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingDescription}>View our privacy policy</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#49A760" />
        </TouchableOpacity>
      </View>

      {/* Support */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="help-circle" size={20} color="#FF9800" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Help & FAQ</Text>
            <Text style={styles.settingDescription}>Get help and answers</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#49A760" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="mail" size={20} color="#4A90E2" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Contact Support</Text>
            <Text style={styles.settingDescription}>Reach out to our team</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#49A760" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="star" size={20} color="#FFD700" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Rate App</Text>
            <Text style={styles.settingDescription}>Rate us on app store</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#49A760" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
</View>
</Modal>




 {/* About Us Modal */}
 <Modal
 visible={showAboutModal}
 transparent={true}
 animationType="slide"
 onRequestClose={() => setShowAboutModal(false)}
>
 <View style={styles.modalOverlay}>
   <View style={[styles.modalContent, styles.bottomSheetStyle]}>
     <View style={styles.modalHeader}>
       <Text style={styles.modalTitle}>About MandiGo</Text>
       <TouchableOpacity onPress={() => setShowAboutModal(false)}>
         <Icon name="close" size={24} color="#666" />
       </TouchableOpacity>
     </View>
     
     <ScrollView style={styles.modalList}>
       <View style={styles.aboutContent}>
         <View style={styles.aboutLogo}>
           <Text style={styles.aboutLogoText}>🌾</Text>
         </View>
         
         <Text style={styles.aboutTitle}>MandiGo</Text>
         <Text style={styles.aboutSubtitle}>Agri Market Price Watch</Text>
         
         <Text style={styles.aboutDescription}>
           A real-time GIS-based comprehensive market decision support system for all agricultural stakeholders, including farmers, producers, consumers, wholesalers, and retailers.
         </Text>
         
         <View style={styles.aboutFeatures}>
           <Text style={styles.aboutFeaturesTitle}>Key Features:</Text>
           <Text style={styles.aboutFeature}>• Real-time price monitoring</Text>
           <Text style={styles.aboutFeature}>• Georeferenced market data</Text>
           <Text style={styles.aboutFeature}>• Crowdsourced price information</Text>
           <Text style={styles.aboutFeature}>• Market comparison tools</Text>
           <Text style={styles.aboutFeature}>• Digital trading platform (Coming Soon)</Text>
         </View>
         
         <View style={styles.aboutProject}>
           <Text style={styles.aboutProjectTitle}>Project Information:</Text>
           <Text style={styles.aboutProjectText}>Sponsored by Technology Innovation Hub for translational research on IoT and IoE</Text>
           <Text style={styles.aboutProjectText}>IITB IRCC Project Code: RD/0125-TIHIR18-007</Text>
           <Text style={styles.aboutProjectText}>Grants: TIH-IoT-2025</Text>
         </View>
         
         <Text style={styles.aboutVersion}>Version 1.0.0</Text>
       </View>
     </ScrollView>
   </View>
 </View>
</Modal>