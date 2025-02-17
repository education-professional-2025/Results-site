const filterSelect = document.getElementById('filter');
const instituteSelect = document.getElementById('institute');
const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');
const resultsContainer = document.getElementById('resultsContainer');
let jsonData = [];
let headers = {};

// ملفات CSV المطلوب استدعاؤها
const csvFiles = {
    'علمي': './data_science.csv',
    'ادبي': './data_arts.csv',
    'تاسع': './data_general.csv'
};

// القيم العليا والدنيا لكل مادة
const gradeRanges = {           

    'علمي': {
        'الرياضيات': { max: 600, min: 240 },
        'اللغه العربية': { max: 400, min: 160 },
        'علم الأحياء': { max: 300, min: 120 },
        'الفيزياء': { max: 400, min: 160 },
        'الكيمياء': { max: 200, min: 80 },
        'اللغة الانكليزية': { max: 300, min: 120 },
        'اللغة الفرنسية': { max: 300, min: 120 },
        'المجموع العام': { max: 2500, min: 1000 },
    },
    'ادبي': {
        'الفلسفة': { max: 400, min: 160 },
        'اللغه العربية': { max: 600, min: 240 },
        'التاريخ': { max: 300, min: 120 },
        'الجغرافيا': { max: 300, min: 120 },
        'اللغة الانكليزية': { max: 400, min: 160 },
        'اللغة الفرنسية': { max: 400, min: 160 },
        'المجموع العام': { max: 2400, min: 960 },

    },
    'تاسع': {
        'الرياضيات': { max: 600, min: 240 },
        'اللغة العربية': { max: 400, min: 160 },
        'العلوم العامة': { max: 300, min: 120 },
        'اللغة الانكليزية': { max: 300, min: 120 },
        'اللغة الفرنسية': { max: 300, min: 120 },
        'الاجتماعيات': { max: 200, min: 80 },
        'المجموع العام': { max: 3100, min: 1240 },

    }
};

// الأعمدة الخاصة بالمجموع العام ومادة العربي لكل فرع
const columnIndices = {
    'علمي': { total: 11, arabic: 10 },
    'ادبي': { total: 10, arabic: 6 },
    'تاسع': { total: 11, arabic: 10 }
};

// تحميل البيانات من الملفات
function loadData() {
    const promises = Object.entries(csvFiles).map(([branch, file]) =>
        fetch(file)
            .then(response => response.text())
            .then(csv => {
                const lines = csv.split('\n');
                const fileHeaders = lines[0].split(',').map(header => header.trim());
                headers[branch] = [...fileHeaders, 'النتيجة'];
                const data = lines.slice(1)
                    .map(line => line.split(',').map(item => item.trim()))
                    .filter(line => line.some(item => item !== ""))
                    .map(row => ({ data: row, branch }));
                return data;
            })
            .catch(error => {
                console.error(`Error loading CSV file ${file}:`, error);
                return [];
            })
    );

    Promise.all(promises).then(results => {
        jsonData = results.flat();
        console.log('All data loaded into jsonData:', jsonData);
    });
}

// استدعاء البيانات عند تحميل الصفحة
loadData();

// عرض النتائج
searchButton.addEventListener('click', () => {
    resultsContainer.innerHTML = '<p style="text-align: center; color: White;">جاري البحث...</p>';
    setTimeout(() => { displayResults(); }, 2000);
});

function displayResults() {
    resultsContainer.innerHTML = '';
    const filterValue = filterSelect.value.trim().toLowerCase();
    const instituteValue = instituteSelect.value.trim().toLowerCase();
    const searchValue = searchInput.value.trim();

    if (!filterValue || !instituteValue || !searchValue) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: White;">الرجاء اختيار الفرع، المعهد وإدخال رقم الاكتتاب.</p>';
        return;
    }

    let resultFound = false;

    jsonData.forEach((item) => {
        const data = item.data;
        const branch = item.branch.toLowerCase();
        const enrollmentNumber = data[0]?.trim();
        const instituteName = data[2]?.trim().toLowerCase();

        if (branch === filterValue && enrollmentNumber === searchValue && instituteName === instituteValue) {
            const totalScoreIndex = columnIndices[filterValue].total;
            const arabicScoreIndex = columnIndices[filterValue].arabic;
            const totalScore = parseInt(data[totalScoreIndex]) || 0;
            const arabicScore = parseInt(data[arabicScoreIndex]) || 0;

            const passingScore = getPassingScore(branch);
            const arabicPassingScore = gradeRanges[branch]['اللغة العربية']?.min || 0;

            const resultDiv = document.createElement('div');
            resultDiv.className = 'styled-table';

            headers[branch].forEach((header, index) => {
                const cell = document.createElement('div');
                cell.className = 'cell';

                const cellTitle = document.createElement('div');
                cellTitle.className = 'cell-title';
                cellTitle.textContent = header;
                cell.appendChild(cellTitle);

                const cellValue = document.createElement('div');
                cellValue.className = 'cell-value';

                if (header !== 'النتيجة') {
                    const score = parseInt(data[index]) || 0;
                    const minScore = gradeRanges[branch][header]?.min;

                    if (minScore && score < minScore) {
                        cellValue.innerHTML = `<span class="fail">${score}</span>`;
                    } else {
                        cellValue.textContent = data[index] || 'غير متوفر';
                    }
                }

                   // إذا كانت الخلية "النتيجة"، أضف حالة النجاح أو الرسوب
                   if (header === 'النتيجة') {
                    let status = 'ناجح';
                    let resultClass = 'success';  // اللون الافتراضي للنجاح
                    // التحقق من النتيجة الإجمالية والعربية
                    if (totalScore < passingScore) {
                        status = 'راسب';
                        resultClass = 'fail';  // اللون الافتراضي للرسوب
                    }
                    // التحقق من الرسوب في اللغة العربية
                    if (arabicScore < arabicPassingScore) {
                        status = 'راسب (العربي)';
                        resultClass = 'fail'; // اللون الافتراضي للرسوب
                    }

                    cellValue.innerHTML = `<span class="result-status ${resultClass}">${status}</span>`;
                }

                cell.appendChild(cellValue);

                const range = gradeRanges[branch][header] || {};
                if (range.max) {
                    const rangeInfo = document.createElement('div');
                    rangeInfo.className = 'range-info';
                    rangeInfo.innerHTML = `
                        <i class="icon-up">⬆</i>${range.max}
                        <i class="icon-down">⬇</i>${range.min}
                    `;
                    cell.appendChild(rangeInfo);
                }

                resultDiv.appendChild(cell);
            });

            resultsContainer.appendChild(resultDiv);
            resultFound = true;
        }
    });

    if (!resultFound) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: White;">لم يتم العثور على نتيجة.</p>';
    }
}

function getPassingScore(branch) {
    const maxScores = {
        'علمي': 2500,
        'ادبي': 2400,
        'تاسع': 3100
    };

    const passingPercentages = {
        'علمي': 0.4,
        'ادبي': 0.5,
        'تاسع': 0.4
    };

    return Math.ceil(maxScores[branch] * passingPercentages[branch]);
}
