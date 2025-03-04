let db;
let people = [];  // 改回使用 let，并初始化为空数组

// 初始化表格
function initTable() {
    renderPeople(people);
}

// 渲染人员列表
function renderPeople(peopleToShow) {
    const tbody = document.getElementById('peopleList');
    tbody.innerHTML = '';
    
    peopleToShow.forEach(person => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${person.name}</td>
            <td>${person.department}</td>
            <td>${person.position}</td>
        `;
        // 添加点击事件
        row.addEventListener('click', () => {
            const textToCopy = `${person.name} ${person.department}`;
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    showStatus('已复制：' + textToCopy, 'success');
                })
                .catch(err => {
                    showStatus('复制失败：' + err.message, 'error');
                });
        });
        tbody.appendChild(row);
    });
}

// 初始化数据库
async function initDatabase() {
    db = new PersonDB();
    await db.init();
    // 加载已存储的数据
    loadStoredPeople();
}

// 加载已存储的人员数据
async function loadStoredPeople() {
    try {
        people = await db.getAllPeople();
        renderPeople(people);
    } catch (error) {
        showStatus('加载数据失败：' + error.message, 'error');
    }
}

// 添加编辑框相关代码
const modal = document.getElementById('editModal');
const editButton = document.getElementById('editButton');
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');
const csvEditor = document.getElementById('csvEditor');

// 打开编辑框
editButton.addEventListener('click', () => {
    // 将现有数据加载到编辑框
    const csvContent = people.map(p => 
        `${p.name},${p.department},${p.position}`
    ).join('\n');
    csvEditor.value = csvContent;
    modal.style.display = 'block';
});

// 保存编辑内容
saveButton.addEventListener('click', async () => {
    try {
        const text = csvEditor.value;
        const rows = text.split('\n');
        const newPeople = rows
            .filter(row => row.trim()) // 过滤空行
            .map(row => {
                const [name, department, position] = row.split(',').map(cell => cell.trim());
                return { name, department, position };
            });

        // 保存到数据库
        await db.addPeople(newPeople);
        people = newPeople;
        renderPeople(people);
        showStatus('数据保存成功！', 'success');
        modal.style.display = 'none';
    } catch (error) {
        showStatus('保存失败：' + error.message, 'error');
    }
});

// 关闭编辑框
cancelButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

// 点击模态框外部关闭
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// 显示状态消息
function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status-message';
    }, 3000);
}

// 搜索功能
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchText = e.target.value.toLowerCase();
    const filtered = people.filter(person => {
        const namePinyin = pinyinPro.pinyin(person.name, { toneType: 'none' }).toLowerCase();
        const nameFirst = pinyinPro.pinyin(person.name, { pattern: 'first', toneType: 'none' }).toLowerCase();
        
        return person.name.includes(searchText) || // 匹配汉字
               namePinyin.includes(searchText) || // 匹配完整拼音
               nameFirst.includes(searchText);    // 匹配拼音首字母
    });
    
    renderPeople(filtered);
});

// 清空数据
document.getElementById('clearButton').addEventListener('click', async () => {
    try {
        await db.clearData();
        people = [];
        renderPeople(people);
        showStatus('数据已清空！', 'success');
    } catch (error) {
        showStatus('清空数据失败：' + error.message, 'error');
    }
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
}); 
