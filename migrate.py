from app import app, db
with app.app_context():
    db.engine.execute("ALTER TABLE workflow ADD COLUMN is_default BOOLEAN DEFAULT 0")
