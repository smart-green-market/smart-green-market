import os
import json
import shutil
import urllib.parse
from datetime import datetime

history_dir = r"C:\Users\admin\AppData\Roaming\Code\User\History"
project_path_marker = "smart-green-market/frontend/web-site/src/components/dealer"
project_path_marker2 = "smart-green-market/frontend/web-site/src/pages/dealer"

restored_files = []

for root, dirs, files in os.walk(history_dir):
    if "entries.json" in files:
        entries_path = os.path.join(root, "entries.json")
        try:
            with open(entries_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            resource = data.get("resource", "")
            resource_lower = resource.lower()
            
            if project_path_marker in resource_lower or project_path_marker2 in resource_lower:
                entries = data.get("entries", [])
                if not entries:
                    continue
                
                # Sort entries by timestamp desc
                entries.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
                
                # Get the absolute latest entry
                latest_entry = entries[0]
                entry_id = latest_entry.get("id")
                
                src_file = os.path.join(root, entry_id)
                if os.path.exists(src_file):
                    # Decode the resource path to a real Windows path
                    # resource: file:///d%3a/doantotnghiep/smart-green-market/frontend/web-site/src/pages/dealer/inventory.jsx
                    decoded_path = urllib.parse.unquote(resource)
                    if decoded_path.startswith("file:///"):
                        decoded_path = decoded_path[8:] # remove file:///
                    
                    # Normalize path
                    target_path = os.path.normpath(decoded_path)
                    
                    # Make sure the target directory exists
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    
                    # Copy the file
                    shutil.copy2(src_file, target_path)
                    restored_files.append(target_path)
                    print(f"Restored: {target_path}")
                        
        except Exception as e:
            pass

print(f"\nRestored {len(restored_files)} files to their latest state.")
