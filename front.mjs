// import {toNumber} from './converters.js';
// console.log(toNumber('122'));
// console.log('122');
const fields = new Map();

const ID = {
    selectTitle: 'titleName',
    selectSubtitle: 'subtitleName',
    ulSubtitleData: 'subtitleData',
    container: 'container',
    objectForm: 'dynamic__object',
    inputs: {
        titleName: 'titleInput',
        fieldName: 'fieldInput'
    }
};

const windows = {
    title: 'title',
    subtitle: 'subtitle',
    fieldAdd: 'field_add',
    fieldEdit: 'field_edit',
    fieldDelete: 'field_delete',
    objectEdit: 'object_edit'
};

let currentTitle = '';
let currentSubtitle = -1;
let currentData = {}


async function save(fileName) {
    const data = {
        file: fileName,
        value: currentData
    }

    const type = 'data:application/octet-stream;base64, ';
    const text = JSON.stringify(currentData, null, 2);
    const base = utf8_to_b64(text);
    const res = type + base;

    const link = document.createElement('a');
    link.setAttribute('href', res);
    link.setAttribute('download', 'someFile.json');
    link.click();

    // const response = await fetch('http://localhost:3000/send', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json;charset=utf-8'
    //     },
    //     body: JSON.stringify(data)
    // });

    // const filePath = await response.text();

    // const link = document.createElement('a');
    // link.setAttribute('href', `http://localhost:3000/${filePath}`);
    // link.setAttribute('download', '');
    // link.click();

    function utf8_to_b64(str) {
        return window.btoa(unescape(encodeURIComponent(str)));
    }
}

async function test() {

    const input = document.getElementById('ff');

    console.log(input.value);
    console.log(input.files[0]);

    let reader = new FileReader();

    reader.readAsText(input.files[0]);

    reader.onload = function () {
        const data = JSON.parse(reader.result);
            
        fields.clear();
        currentTitle = Object.keys(data)[0];
        currentSubtitle = 0;
        currentData = data;

        Object.keys(currentData[currentTitle][currentSubtitle]).forEach(key => fields.set(key, key));

        updateTitles();
    };

    reader.onerror = function () {
        console.log(reader.error);
    };
}



async function load(fileName) {
    if (!fileName) throw new Error('fileName is invalid');

    const response = await fetch(`http://localhost:3000/files/${fileName}.json`, {
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    });
    const data = await response.json();

    fields.clear();
    currentTitle = Object.keys(data)[0];
    currentSubtitle = 0;
    currentData = data;

    Object.keys(currentData[currentTitle][currentSubtitle]).forEach(key => fields.set(key, key));

    updateTitles();
}


function createWindow(windowType, isChangeValues, objectField) {
    const container = document.getElementById(ID.container);
    const divWindow = document.createElement('div');
    divWindow.id = windowType;

    container.append(divWindow);

    const divContainer = document.createElement('div');
    divWindow.append(divContainer);

    const buttonCancel = createButton('Отмена', () => deleteWindow(windowType));

    switch (windowType) {
        case windows.title:
            createTitle();
            break;
        case windows.subtitle:
            createSubtitle();
            break;
        case windows.fieldAdd:
            createField();
            break;
        case windows.fieldDelete:
            createFieldDelete();
            break;
        case windows.fieldEdit:
            createFieldEdit();
            break;
        case windows.objectEdit:
            createObjectEdit();
            break;
        default:
            return;
    }

    divWindow.append(buttonCancel);

    function createTitle() {
        const input = createInput('Название', ID.inputs.titleName, isChangeValues ? currentTitle : '');
        divContainer.append(input);


        const buttonApply = createButton('Принять', () => addOrEditTitle(isChangeValues));
        divWindow.append(buttonApply);
    }

    function createSubtitle() {
        fields.forEach((value, key) => {
            const field = currentData[currentTitle][currentSubtitle][value];

            if (typeof field === 'object') {
                const button = createButton(key, () => createWindow(windows.objectEdit, isChangeValues, value));
                divContainer.append(button);

                return;
            }

            const input = createInput(value, `dynamic__${key}`, isChangeValues ? field : '');
            divContainer.append(input);
        });


        const buttonApply = createButton('Принять', () => addOrEditSubtitle(isChangeValues ? currentSubtitle : Object.keys(currentData[currentTitle]).length, isChangeValues));
        divWindow.append(buttonApply);
    }

    function createField() {
        const input = createInput('Название поля', ID.inputs.fieldName);
        divContainer.append(input);


        const buttonApply = createButton('Принять', () => addField());
        divWindow.append(buttonApply);
    }

    function createFieldDelete() {
        divContainer.remove();

        buttonCancel.id = 'editCancel';

        fields.forEach((value, key) => {
            const button = createButton(value, () => {
                subtitleForEach(direction => delete direction[key]);

                fields.delete(key);
                button.remove();

                updateSubtitleData();
            });

            divWindow.append(button);
        });
    }

    function createFieldEdit() {
        throw new Error('createFieldEdit is not implemented');
    }

    function createObjectEdit() {
        const object = currentData[currentTitle][currentSubtitle][objectField];

        for (const [key, value] of Object.entries(object)) {
            const input = createInput(key, `dynamic__${key}`, value);
            divContainer.append(input);
        }

        const buttonApply = createButton('Принять', () => {
            Object.keys(object).forEach(key =>
                currentData[currentTitle][currentSubtitle][objectField][key] = +document.getElementById(`dynamic__${key}`).value
            );

            deleteWindow(windows.objectEdit);

            updateSubtitleData();
        });

        divWindow.append(buttonApply);
    }
}

function deleteWindow(windowID) {
    const divWindow = document.getElementById(windowID);

    divWindow.remove();
}


function updateTitleData() {
    const selectFaculty = document.getElementById(ID.selectTitle);

    currentTitle = selectFaculty.value;

    currentSubtitle = 0;

    updateSubtitles();
}

function updateSubtitleData() {
    const selectSubtitle = document.getElementById(ID.selectSubtitle);

    const ul = document.getElementById(ID.ulSubtitleData);
    ul.innerHTML = '';

    if (!selectSubtitle.value) return;

    currentSubtitle = selectSubtitle.value;


    fields.forEach(key => {
        const li = document.createElement('li');
        li.innerHTML = `<b>${key}</b>: `;

        handleData(currentData[currentTitle][currentSubtitle][key], li);

        ul.append(li);
    });


    function handleData(data, liOuter) {
        if (!liOuter instanceof HTMLLIElement) throw new Error('parameter \"li\" is wrong type');
        if (!data) return;

        if (typeof data == 'string' || typeof data == 'number')
            liOuter.innerHTML += convertToHref(data);
        else {
            const ulInner = document.createElement('ul');
            liOuter.append(ulInner);

            if (!Array.isArray(data)) {
                for (const [key, value] of Object.entries(data)) {
                    const liInner = document.createElement('li');
                    liInner.innerHTML = `<b>${key}</b>: `;
                    ulInner.append(liInner);

                    if (typeof value !== 'object') liInner.innerHTML += convertToHref(value);
                    else handleData(value, liInner);
                }
            } else {
                for (const value of Object.values(data)) {
                    const emptySpace = '&#160;';

                    const liInner = document.createElement('li');
                    liInner.innerHTML = emptySpace;
                    ulInner.append(liInner);

                    if (typeof value !== 'object') liInner.innerHTML = convertToHref(value);
                    else handleData(value, liInner);
                }
            }
        }
    }
}

function addOrEditTitle(isEditTitle) {
    const input = document.getElementById(ID.inputs.titleName);

    if (!isEditTitle) currentData[input.value] = [];
    else delete Object.assign(currentData, {
        [input.value]: currentData[currentTitle]
    })[currentTitle];

    currentTitle = input.value;

    updateTitles();

    deleteWindow(windows.title);
}

function removeTitle() {
    const selectTitle = document.getElementById(ID.selectTitle);

    delete(currentData[selectTitle.value]);

    currentTitle = Object.keys(currentData)[0] ?? '';

    updateTitles();
}


function addOrEditSubtitle(subtitleIndex, isEditSubtitle) {
    if (!isEditSubtitle) currentData[currentTitle][subtitleIndex] = {}

    fields.forEach((value, key) => {
        const input = document.getElementById(`dynamic__${key}`);
        if (!input) return;

        currentData[currentTitle][subtitleIndex][value] = convertToNumber(input.value);
    });

    currentSubtitle = subtitleIndex;

    updateSubtitles();

    deleteWindow(windows.subtitle);
}

function removeSubtitle() {
    const selectTitle = document.getElementById(ID.selectTitle);

    if (!currentData[selectTitle.value]) return;

    currentData[selectTitle.value].splice(currentSubtitle, 1);

    if (--currentSubtitle < 0) currentSubtitle = 0;

    updateTitles();
}


function addField() {
    const input = document.getElementById(ID.inputs.fieldName);

    const newField = input.value;

    fields.set(newField, newField);

    subtitleForEach(direction => direction[newField] = '');

    updateSubtitleData();

    deleteWindow(windows.fieldAdd);
}

//#region Help functions

function subtitleForEach(action) {
    Object.keys(currentData).forEach(title =>
        currentData[title].forEach(subtitle => action(subtitle))
    );
}

function updateTitles() {
    const selectTitle = document.getElementById(ID.selectTitle);
    selectTitle.innerHTML = '';

    Object.keys(currentData).forEach(title => {
        const optionTitle = document.createElement('option');
        optionTitle.innerHTML = title;
        selectTitle.append(optionTitle);
    });

    selectTitle.value = currentTitle;

    updateSubtitles();
}

function updateSubtitles() {
    const selectSubtitle = document.getElementById(ID.selectSubtitle);
    selectSubtitle.innerHTML = '';

    if (!Object.keys(currentData).length) return;

    currentData[currentTitle].forEach((title, i) => {
        if (!Object.keys(title).length) return;

        const optionSubtitle = document.createElement('option');
        optionSubtitle.innerHTML = title[fields.keys().next().value];
        optionSubtitle.value = i;

        selectSubtitle.append(optionSubtitle);
    });

    selectSubtitle.value = currentSubtitle;

    updateSubtitleData();
}


function createButton(text, action) {
    const button = document.createElement('button');
    button.addEventListener('click', action);
    button.innerHTML = text;

    return button;
}

function createInput(placeholder, id, value = '', type = 'text') {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.id = id;
    input.value = value;

    return input;
}

//#endregion


function convertToNumber(value) {
    if (!isNaN(+value)) return +value;
    return value;
}


function convertToHref(value) {
    if (typeof value == 'string' && value.includes('http')) value = `<a href='${value}'>${value}</a>`;
    return value;
}