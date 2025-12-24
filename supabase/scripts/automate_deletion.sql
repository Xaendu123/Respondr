-- ============================================================================
-- AUTOMATE USER DELETION PROCESS
-- ============================================================================
-- Database trigger that automatically executes anonymization when a deletion
-- request is created. This ensures fully automated user deletion with zero
-- external infrastructure requirements.
-- ============================================================================

-- Function to automatically anonymize user data when deletion request is created
CREATE OR REPLACE FUNCTION auto_anonymize_on_deletion_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Execute anonymization immediately
  PERFORM anonymize_user_data(NEW.user_id);
  
  -- Return the new record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires AFTER a deletion request is inserted
CREATE TRIGGER trigger_auto_anonymize_on_deletion_request
  AFTER INSERT ON data_deletion_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')  -- Only trigger for new pending requests
  EXECUTE FUNCTION auto_anonymize_on_deletion_request();

-- ============================================================================
-- HOW IT WORKS
-- ============================================================================
-- 
-- 1. User requests deletion via app (PrivacySettingsScreen)
-- 2. App creates record in data_deletion_requests table (status='pending')
-- 3. Database trigger fires automatically
-- 4. anonymize_user_data() function executes
-- 5. User data is immediately anonymized
-- 6. Deletion request status updated to 'completed'
--
-- Benefits:
-- ✅ Fully automated
-- ✅ No external dependencies
-- ✅ Immediate execution
-- ✅ Reliable (runs even if app is down)
-- ✅ No additional infrastructure needed
--
-- ============================================================================

