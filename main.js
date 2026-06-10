const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const mm = require('music-metadata');
const { autoUpdater } = require('electron-updater');

app.disableHardwareAcceleration();

let mainWindow;

function setupAutoUpdater() {
    autoUpdater.autoDownload = false;

    autoUpdater.on('update-available', (info) => {
        console.log('Доступна новая версия:', info);

        dialog.showMessageBox({
            type: 'info',
            title: 'Доступно обновление',
            message: `Найдена новая версия ${info.version}. Скачать сейчас?`,
            buttons: ['Скачать', 'Позже']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.downloadUpdate();

                if (mainWindow) mainWindow.webContents.send('update-status', 'Скачивание обновления...');
            }
        });
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Обновление скачано:', info);

        dialog.showMessageBox({
            type: 'info',
            title: 'Установка обновления',
            message: 'Обновление скачано. Перезапустить приложение сейчас?',
            buttons: ['Перезапустить', 'Позже']
        }).then((result) => {
            if (result.response === 0) autoUpdater.quitAndInstall()
        });
    });

    autoUpdater.on('error', (error) => {
        console.error('Ошибка обновления:', error);
    });

    if (!app.isPackaged) {
        console.log('Приложение в режиме разработки, автообновление отключено.');

        return;
    }

    autoUpdater.checkForUpdates();

    setInterval(() => {
        autoUpdater.checkForUpdates();
    }, 60 * 60 * 1000);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'icon.png'),
        backgroundColor: '#1a1e2b',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile('index.html');

    Menu.setApplicationMenu(null);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        setupAutoUpdater();
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (!result.canceled) {
        const folderPath = result.filePaths[0];
        const files = fs.readdirSync(folderPath)
            .filter(file => file.match(/\.(mp3|flac|wav|m4a|ogg)$/i))
            .map(file => path.join(folderPath, file));

        return files;
    }

    return [];
});

ipcMain.handle('save-playlist', async (event, playlist) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Сохранить плейлист',
        defaultPath: 'playlist.json',
        filters: [{ name: 'JSON files', extensions: ['json'] }, { name: 'All files', extensions: ['*'] }]
    });

    if (!result.canceled && result.filePath) {
        try {
            const data = JSON.stringify(playlist, null, 2);

            fs.writeFileSync(result.filePath, data, 'utf8');

            return { success: true, path: result.filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    return { success: false, canceled: true };
});

ipcMain.handle('load-playlist', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Загрузить плейлист',
        properties: ['openFile'],
        filters: [{ name: 'JSON files', extensions: ['json'] }, { name: 'All files', extensions: ['*'] }]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const filePath = result.filePaths[0];
            const data = fs.readFileSync(filePath, 'utf8');
            const playlist = JSON.parse(data);

            if (Array.isArray(playlist) && playlist.every(item => typeof item === 'string')) return { success: true, playlist };

            return { success: false, error: 'Неверный формат плейлиста' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    return { success: false, canceled: true };
});

ipcMain.handle('read-metadata', async (event, filePath) => {
    try {
        const metadata = await mm.parseFile(filePath);

        const common = metadata.common;

        let picture = null;

        if (common.picture && common.picture.length > 0) {
            const pic = common.picture[0];

            picture = {
                data: pic.data.toString('base64'),
                format: pic.format
            };
        }

        return {
            success: true,
            tags: {
                title: common.title || null,
                artist: common.artist || null,
                album: common.album || null,
                picture: picture
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
