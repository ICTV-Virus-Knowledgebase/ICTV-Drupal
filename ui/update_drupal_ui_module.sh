#!/usr/bin/env bash
# =============================================================================
# update_drupal_ui_module.sh
# Opens an SFTP session to upload a file, then opens an SSH session to run
# a command on the same remote server.
# =============================================================================

# Display usage information.
function usage {
   echo -e "Usage: $0 -h <remote host> -m <drupal module name> -f <base filename> \n"
   exit 1
}

# Parse input parameters
while getopts ":h:m:f:" opt; do
   case ${opt} in
      h )
         REMOTE_HOST=$OPTARG
         ;;
      m )
         DRUPAL_MODULE=$OPTARG
         ;;
      f )
         BASE_FILENAME=$OPTARG
         ;;
      \? )
         usage
         ;;
   esac
done

# Check if required parameters are provided
if [ -z "$REMOTE_HOST" ] || [ -z "$DRUPAL_MODULE" ] || [ -z "$BASE_FILENAME" ]; then
    usage
fi


# --- Configuration -----------------------------------------------------------
REMOTE_USER="ubuntu"
#REMOTE_HOST="test.ictv.global"
REMOTE_PORT=22                         # Change if your server uses a non-standard port

# Path to your private key (or remove -i flag to use password)
SSH_KEY="~/.ssh/ICTV-ddempsey.pem"

# Destination dirs on the remote server
REMOTE_JS_DIR="/var/www/drupal/site/modules/custom/$DRUPAL_MODULE/assets/js"
REMOTE_CSS_DIR="/var/www/drupal/site/modules/custom/$DRUPAL_MODULE/assets/css"

# Source dirs on the local machine
LOCAL_JS_DIR="/c/Users/ddempsey/source/repos/ICTV-Drupal/$DRUPAL_MODULE/assets/js"
LOCAL_CSS_DIR="/c/Users/ddempsey/source/repos/ICTV-Drupal/$DRUPAL_MODULE/assets/css"

# The files to upload
LOCAL_JS_FILE="ICTV_$BASE_FILENAME.js"
LOCAL_CSS_FILE="$BASE_FILENAME.css"            

BUILD_SCRIPT="./build$BASE_FILENAME.sh"

REMOTE_COMMAND="echo 'SSH session open. Clearing the Drush cache...'; drush cr"

# -----------------------------------------------------------------------------

echo "========================================"
echo " Step 1: Building the module"
echo "========================================"

bash "$BUILD_SCRIPT"

# Check that the build completed successfully before continuing
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed. Aborting." >&2
    exit 1
fi

# -----------------------------------------------------------------------------

echo "========================================"
echo " Step 2: Opening SFTP session"
echo "========================================"

sftp "${REMOTE_HOST}" <<EOF
# -i "$SSH_KEY" -P "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" <<EOF

# Change to the JavaScript directory on the remote server
cd $REMOTE_JS_DIR

# Change to the JavaScript directory on the local machine
lcd $LOCAL_JS_DIR

pwd
lpwd

# Upload the JavaScript file to the remote directory
put $LOCAL_JS_FILE

# Change to the CSS directory on the remote server
cd $REMOTE_CSS_DIR

# Change to the CSS directory on the local machine
lcd $LOCAL_CSS_DIR

pwd
lpwd

# Upload the CSS file to the remote directory
put $LOCAL_CSS_FILE

# Exit the SFTP session
bye
EOF

# Check that SFTP completed successfully before continuing
if [ $? -ne 0 ]; then
    echo "ERROR: SFTP session failed. Aborting." >&2
    exit 1
fi

echo ""
echo "SFTP session closed successfully."
echo ""
echo "========================================"
echo " Step 3: Opening SSH session"
echo "========================================"

ssh "${REMOTE_HOST}" "$REMOTE_COMMAND"
# -i "$SSH_KEY" -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" "$REMOTE_COMMAND"

if [ $? -ne 0 ]; then
    echo "ERROR: SSH command failed." >&2
    exit 1
fi

echo ""
echo "SSH session closed. All done."