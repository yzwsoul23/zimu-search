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

// 处理 CSV 文件导入
document.getElementById('csvFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // 使用 FileReader 来正确处理中文编码
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const rows = text.split('\n');
                const newPeople = rows
                    .slice(1) // 跳过标题行
                    .filter(row => row.trim()) // 过滤空行
                    .map(row => {
                        const [name, department, position] = row.split(',').map(cell => cell.trim());
                        return { name, department, position };
                    });

                // 保存到数据库
                await db.addPeople(newPeople);
                people = newPeople;
                renderPeople(people);
                showStatus('数据导入成功！', 'success');
            } catch (error) {
                showStatus('导入失败：' + error.message, 'error');
            }
        };
        // 以 UTF-8 编码读取文件
        reader.readAsText(file, 'UTF-8');
    } catch (error) {
        showStatus('导入失败：' + error.message, 'error');
    }
    
    // 清除文件输入，允许重复导入相同文件
    e.target.value = '';
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
