import pytest
from selenium.webdriver import Chrome, ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# 注意：这些测试需要安装selenium和chromedriver
# pip install selenium

@pytest.fixture(scope="module")
def browser():
    """创建浏览器实例"""
    options = ChromeOptions()
    options.add_argument('--headless')  # 无头模式
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    browser = Chrome(options=options)
    browser.implicitly_wait(10)
    yield browser
    browser.quit()

def test_home_page_loads(browser, app):
    """测试首页加载"""
    # 获取应用的URL
    with app.app_context():
        url = 'http://localhost:5005/'
    
    browser.get(url)
    assert "工作日历系统" in browser.title
    
    # 检查关键元素是否存在
    assert browser.find_element(By.ID, "task-list-container") is not None
    assert browser.find_element(By.ID, "calendar-container") is not None

def test_task_list_display(browser, app, sample_task):
    """测试任务列表显示"""
    with app.app_context():
        url = 'http://localhost:5005/'
    
    browser.get(url)
    
    # 等待任务列表加载
    task_items = WebDriverWait(browser, 10).until(
        EC.presence_of_all_elements_located((By.CLASS_NAME, "task-item"))
    )
    
    # 验证至少有一个任务显示
    assert len(task_items) >= 1
    
    # 验证示例任务是否显示
    task_titles = [item.find_element(By.CLASS_NAME, "task-title").text for item in task_items]
    assert "测试任务" in task_titles

def test_task_detail_view(browser, app, sample_task):
    """测试任务详情查看"""
    with app.app_context():
        url = f'http://localhost:5005/tasks/{sample_task.id}'
    
    browser.get(url)
    
    # 等待任务详情加载
    task_title = WebDriverWait(browser, 10).until(
        EC.presence_of_element_located((By.ID, "task-title"))
    )
    
    # 验证任务详情是否正确显示
    assert task_title.text == "测试任务"
    assert browser.find_element(By.ID, "task-description").text == "这是一个测试任务"
    assert browser.find_element(By.ID, "task-status").text == "进行中"

def test_task_review_comments_display(browser, app, sample_completed_task, sample_review_comments):
    """测试任务复盘评论显示"""
    with app.app_context():
        url = f'http://localhost:5005/tasks/{sample_completed_task.id}'
    
    browser.get(url)
    
    # 等待评论区加载
    comments = WebDriverWait(browser, 10).until(
        EC.presence_of_all_elements_located((By.CLASS_NAME, "review-comment"))
    )
    
    # 验证评论数量
    assert len(comments) == 3
    
    # 验证评论排序（从新到旧）
    comment_times = []
    for comment in comments:
        time_element = comment.find_element(By.CLASS_NAME, "comment-time")
        comment_times.append(time_element.get_attribute("data-timestamp"))
    
    # 验证时间戳是降序排列的
    for i in range(len(comment_times) - 1):
        assert comment_times[i] >= comment_times[i+1]