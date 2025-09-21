#!/usr/bin/env python3
"""
数据库迁移脚本：为issue表添加solutions和successful_solution字段
"""

import sqlite3
import os

def migrate_database():
    """迁移数据库，添加新字段"""
    db_path = os.path.join('instance', 'work_calendar.db')
    
    if not os.path.exists(db_path):
        print(f"数据库文件不存在: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(issue)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # 添加solutions字段
        if 'solutions' not in columns:
            cursor.execute("ALTER TABLE issue ADD COLUMN solutions TEXT")
            print("已添加solutions字段")
        else:
            print("solutions字段已存在")
        
        # 添加successful_solution字段
        if 'successful_solution' not in columns:
            cursor.execute("ALTER TABLE issue ADD COLUMN successful_solution TEXT")
            print("已添加successful_solution字段")
        else:
            print("successful_solution字段已存在")
        
        conn.commit()
        conn.close()
        
        print("数据库迁移完成")
        return True
        
    except Exception as e:
        print(f"数据库迁移失败: {e}")
        return False

if __name__ == '__main__':
    migrate_database()