import sys
import os
import argparse

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app import create_app
from models.user import User
from services.workflow_service import WorkflowService

app = create_app() # Create the app instance

with app.app_context():
    from models import db # Import db within the app context

def create_admin_user(username, email, password):
    with app.app_context():
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"Error: User with username '{username}' already exists.")
            return

        admin = User(username=username, email=email, is_admin=True)
        admin.password = password # Use the password setter
        db.session.add(admin)
        db.session.commit()

        # Copy default workflows for the new admin user
        WorkflowService.copy_default_workflows_for_user(admin.id)

        print(f"Administrator user '{username}' created successfully.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Create an administrator user.')
    parser.add_argument('--username', required=True, help='Username for the admin user')
    parser.add_argument('--email', required=True, help='Email for the admin user')
    parser.add_argument('--password', required=True, help='Password for the admin user')

    args = parser.parse_args()

    create_admin_user(args.username, args.email, args.password)