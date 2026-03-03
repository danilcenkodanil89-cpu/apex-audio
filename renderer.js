// Состояние приложения
let audioFiles = [];          // все треки из текущей папки (библиотека)
let currentTrackIndex = 0;
let audio = new Audio();
let isPlaying = false;

// Текущий режим: 'music' или 'playlist'
let currentView = 'music';
// Если режим playlist, храним ID текущего плейлиста
let currentPlaylistId = null;

// Хранилище плейлистов (в памяти и localStorage)
let playlists = [];

// Загрузка плейлистов из localStorage при старте
function loadPlaylists() {
  const saved = localStorage.getItem('playlists');
  if (saved) {
    try {
      playlists = JSON.parse(saved);
    } catch (e) {
      playlists = [];
    }
  } else {
    // Плейлист по умолчанию
    playlists = [
      { id: 'favorites', name: 'Избранное', tracks: [] }
    ];
  }
  renderPlaylistsList();
}

// Сохранение плейлистов в localStorage
function savePlaylists() {
  localStorage.setItem('playlists', JSON.stringify(playlists));
}

// Элементы DOM
const navItems = document.querySelectorAll('.nav-item');
const viewTitle = document.getElementById('view-title');
const tracksListEl = document.getElementById('tracks-list');
const playlistContainer = document.querySelector('.playlists-container');
const playlistsListEl = document.getElementById('playlists-list');
const createPlaylistBtn = document.getElementById('create-playlist');
const selectFolderBtn = document.getElementById('select-folder');
const playPauseBtn = document.getElementById('play-pause');
const stopBtn = document.getElementById('stop');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progressBar = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeBar = document.getElementById('volume');
const loopBtn = document.getElementById('loop');

// Элементы для метаданных
const coverImage = document.getElementById('cover-image');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const trackAlbum = document.getElementById('track-album');

// Элементы модального окна для плейлиста
const playlistModal = document.getElementById('playlist-modal');
const newPlaylistInput = document.getElementById('new-playlist-name');
const modalCreate = document.getElementById('modal-create');
const modalCancel = document.getElementById('modal-cancel');

// Элементы модального окна обучения
const helpModal = document.getElementById('help-modal');
const helpButton = document.getElementById('help-button');
const helpClose = document.getElementById('help-close');

// Переменная для состояния зацикливания
let loopEnabled = false;

// Инициализация
loadPlaylists();
updateSidebarVisibility();

// Показываем "Что нового?" при первом запуске
const hasSeenChangelog = localStorage.getItem('hasSeenChangelog_v2.1.0');
if (!hasSeenChangelog) {
  setTimeout(() => {
    helpModal.style.display = 'flex';
  }, 500);
  localStorage.setItem('hasSeenChangelog_v2.1.0', 'true');
}

// Обработчики навигации
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    const view = item.dataset.view;
    currentView = view;
    currentPlaylistId = null;
    viewTitle.textContent = view === 'music' ? 'Музыка' : 'Плейлисты';
    updateSidebarVisibility();
    renderCurrentView();
  });
});

// Показать/скрыть список плейлистов в сайдбаре
function updateSidebarVisibility() {
  if (currentView === 'playlists') {
    playlistContainer.style.display = 'flex';
  } else {
    playlistContainer.style.display = 'none';
  }
}

// Отрисовка текущего представления (Music или выбранный плейлист)
function renderCurrentView() {
  if (currentView === 'music') {
    renderMusicLibrary();
  } else if (currentView === 'playlist' && currentPlaylistId) {
    renderPlaylistTracks(currentPlaylistId);
  } else {
    tracksListEl.innerHTML = '<li style="justify-content: center; color: var(--text-muted);">Выберите плейлист слева</li>';
  }
}

// Отрисовка библиотеки (все треки из папки)
function renderMusicLibrary() {
  if (audioFiles.length === 0) {
    tracksListEl.innerHTML = '<li style="justify-content: center; color: var(--text-muted);">Папка не выбрана. Нажмите "Выбрать папку"</li>';
    return;
  }
  tracksListEl.innerHTML = '';
  audioFiles.forEach((file, index) => {
    const li = document.createElement('li');
    li.dataset.index = index;
    li.dataset.source = 'music';
    li.innerHTML = `
      <span class="track-name">${file.split(/[\\/]/).pop()}</span>
      <div class="track-actions">
        <button class="add-to-playlist" title="Добавить в плейлист"><i class="fas fa-plus"></i></button>
      </div>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-playlist')) return;
      playTrackFromMusic(index);
    });
    li.querySelector('.add-to-playlist').addEventListener('click', (e) => {
      e.stopPropagation();
      showAddToPlaylistModal(file, index, e);
    });
    tracksListEl.appendChild(li);
  });
  highlightCurrentTrackInList();
}

// Отрисовка треков конкретного плейлиста
function renderPlaylistTracks(playlistId) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return;

  viewTitle.textContent = playlist.name;
  if (playlist.tracks.length === 0) {
    tracksListEl.innerHTML = '<li style="justify-content: center; color: var(--text-muted);">Плейлист пуст</li>';
    return;
  }

  tracksListEl.innerHTML = '';
  playlist.tracks.forEach((track, idx) => {
    const li = document.createElement('li');
    li.dataset.trackPath = track.path;
    li.dataset.playlistId = playlistId;
    li.dataset.index = idx;
    li.innerHTML = `
      <span class="track-name">${track.name}</span>
      <div class="track-actions">
        <button class="remove-from-playlist" title="Удалить из плейлиста"><i class="fas fa-times"></i></button>
      </div>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.closest('.remove-from-playlist')) return;
      playTrackFromPlaylist(playlistId, idx);
    });
    li.querySelector('.remove-from-playlist').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromPlaylist(playlistId, idx);
    });
    tracksListEl.appendChild(li);
  });
  highlightCurrentTrackInList();
}

// Подсветка текущего трека в списке
function highlightCurrentTrackInList() {
  document.querySelectorAll('#tracks-list li').forEach(li => li.classList.remove('playing'));
  if (currentView === 'music' && audioFiles[currentTrackIndex]) {
    const currentLi = document.querySelector(`#tracks-list li[data-index="${currentTrackIndex}"]`);
    if (currentLi) currentLi.classList.add('playing');
  }
  else if (currentView === 'playlist' && currentPlaylistId) {
    const playlist = playlists.find(p => p.id === currentPlaylistId);
    if (playlist && playlist.tracks[currentTrackIndex]) {
      const currentLi = document.querySelector(`#tracks-list li[data-index="${currentTrackIndex}"]`);
      if (currentLi) currentLi.classList.add('playing');
    }
  }
}

// Загрузка метаданных через IPC (с заглушкой для обложки)
async function loadMetadata(filePath) {
  console.log('Загружаем метаданные для:', filePath);
  
  // Сбрасываем обложку и информацию
  coverImage.src = '';
  trackTitle.textContent = 'Загрузка...';
  trackArtist.textContent = '';
  trackAlbum.textContent = '';

  try {
    const result = await window.electronAPI.readMetadata(filePath);
    if (result.success) {
      const tags = result.tags;
      trackTitle.textContent = tags.title || filePath.split(/[\\/]/).pop();
      trackArtist.textContent = tags.artist || '';
      trackAlbum.textContent = tags.album || '';

      if (tags.picture) {
        // Если есть обложка в метаданных, используем её
        coverImage.src = `data:${tags.picture.format};base64,${tags.picture.data}`;
      } else {
        // Иначе показываем стандартную SVG-заглушку (музыкальная нота)
        coverImage.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' fill=\'%23a0a0a0\'%3E%3Cpath d=\'M70 25v30c0 8-7 15-15 15s-15-7-15-15 7-15 15-15c3 0 6 1 9 2V27l-20 5v30c0 8-7 15-15 15s-15-7-15-15 7-15 15-15c3 0 6 1 9 2V20l30-7v12z\'/%3E%3C/svg%3E';
      }
    } else {
      console.error('Ошибка получения метаданных:', result.error);
      trackTitle.textContent = filePath.split(/[\\/]/).pop();
      coverImage.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' fill=\'%23a0a0a0\'%3E%3Cpath d=\'M70 25v30c0 8-7 15-15 15s-15-7-15-15 7-15 15-15c3 0 6 1 9 2V27l-20 5v30c0 8-7 15-15 15s-15-7-15-15 7-15 15-15c3 0 6 1 9 2V20l30-7v12z\'/%3E%3C/svg%3E';
    }
  } catch (err) {
    console.error('Ошибка вызова IPC:', err);
    trackTitle.textContent = filePath.split(/[\\/]/).pop();
    coverImage.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' fill=\'%23a0a0a0\'%3E%3Cpath d=\'M70 25v30c0 8-7 15-15 15s-15-7-15-15 7-15 15-15c3 0 6 1 9 2V27l-20 5v30c0 8-7 15-15 15s-15-7-15-15 7-15 15-15c3 0 6 1 9 2V20l30-7v12z\'/%3E%3C/svg%3E';
  }
}

// Функции воспроизведения
function playTrackFromMusic(index) {
  if (index >= 0 && index < audioFiles.length) {
    currentTrackIndex = index;
    currentView = 'music';
    currentPlaylistId = null;
    const filePath = audioFiles[index];
    audio.src = filePath;
    audio.load();
    audio.play();
    loadMetadata(filePath);
    highlightCurrentTrackInList();
  }
}

function playTrackFromPlaylist(playlistId, index) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (playlist && index >= 0 && index < playlist.tracks.length) {
    currentTrackIndex = index;
    currentView = 'playlist';
    currentPlaylistId = playlistId;
    const track = playlist.tracks[index];
    audio.src = track.path;
    audio.load();
    audio.play();
    loadMetadata(track.path);
    highlightCurrentTrackInList();
  }
}

// Меню добавления в плейлист (открывается слева от кнопки)
function showAddToPlaylistModal(trackPath, trackIndex, clickEvent) {
  const trackName = trackPath.split(/[\\/]/).pop();
  
  const menu = document.createElement('div');
  menu.style.position = 'fixed';
  menu.style.background = '#2a2f3f';
  menu.style.border = '1px solid #444';
  menu.style.borderRadius = '8px';
  menu.style.padding = '8px 0';
  menu.style.zIndex = 1000;
  menu.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
  menu.style.minWidth = '180px';

  const title = document.createElement('div');
  title.textContent = 'Добавить в плейлист:';
  title.style.padding = '8px 16px';
  title.style.color = '#aaa';
  title.style.fontSize = '0.8rem';
  title.style.borderBottom = '1px solid #444';
  menu.appendChild(title);

  playlists.forEach(playlist => {
    const item = document.createElement('div');
    item.textContent = playlist.name;
    item.style.padding = '8px 16px';
    item.style.cursor = 'pointer';
    item.style.color = '#e0e0e0';
    item.style.transition = 'background 0.2s';
    item.addEventListener('mouseenter', () => item.style.background = '#3a4055');
    item.addEventListener('mouseleave', () => item.style.background = 'transparent');
    item.addEventListener('click', () => {
      addTrackToPlaylist(playlist.id, trackPath, trackName);
      document.body.removeChild(menu);
    });
    menu.appendChild(item);
  });

  document.body.appendChild(menu);

  const button = clickEvent.currentTarget;
  const rect = button.getBoundingClientRect();

  let left = rect.left - menu.offsetWidth;
  let top = rect.top;

  if (left < 0) {
    left = rect.right;
  }

  if (top + menu.offsetHeight > window.innerHeight) {
    top = window.innerHeight - menu.offsetHeight;
  }

  if (top < 0) top = 0;

  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      if (document.body.contains(menu)) document.body.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

function addTrackToPlaylist(playlistId, trackPath, trackName) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (playlist) {
    if (!playlist.tracks.some(t => t.path === trackPath)) {
      playlist.tracks.push({ path: trackPath, name: trackName });
      savePlaylists();
      renderPlaylistsList();
      if (currentPlaylistId === playlistId) {
        renderPlaylistTracks(playlistId);
      }
    } else {
      alert('Трек уже в плейлисте');
    }
  }
}

function removeFromPlaylist(playlistId, trackIndex) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (playlist) {
    playlist.tracks.splice(trackIndex, 1);
    savePlaylists();
    if (currentPlaylistId === playlistId) {
      renderPlaylistTracks(playlistId);
    }
    if (currentView === 'playlist' && currentPlaylistId === playlistId && currentTrackIndex === trackIndex) {
      audio.pause();
      audio.currentTime = 0;
      trackTitle.textContent = 'Не выбрано';
      trackArtist.textContent = '';
      trackAlbum.textContent = '';
      coverImage.src = '';
      currentTrackIndex = 0;
    }
  }
}

// Отрисовка списка плейлистов в сайдбаре
function renderPlaylistsList() {
  playlistsListEl.innerHTML = '';
  playlists.forEach(playlist => {
    const li = document.createElement('li');
    li.dataset.id = playlist.id;
    li.innerHTML = `
      <i class="fas fa-list"></i>
      <span class="playlist-name">${playlist.name}</span>
      <span style="margin-left: auto; font-size:0.8rem; color: var(--text-muted);">${playlist.tracks.length}</span>
    `;
    
    li.addEventListener('click', () => {
      document.querySelectorAll('#playlists-list li').forEach(l => l.classList.remove('active'));
      li.classList.add('active');
      currentView = 'playlist';
      currentPlaylistId = playlist.id;
      viewTitle.textContent = playlist.name;
      renderPlaylistTracks(playlist.id);
    });

    li.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showPlaylistContextMenu(e, playlist.id);
    });

    playlistsListEl.appendChild(li);
  });
}

// Контекстное меню для удаления плейлиста
function showPlaylistContextMenu(event, playlistId) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return;

  const menu = document.createElement('div');
  menu.style.position = 'fixed';
  menu.style.background = '#2a2f3f';
  menu.style.border = '1px solid #444';
  menu.style.borderRadius = '8px';
  menu.style.padding = '8px 0';
  menu.style.zIndex = 1000;
  menu.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
  menu.style.minWidth = '160px';

  const item = document.createElement('div');
  item.textContent = 'Удалить плейлист';
  item.style.padding = '8px 16px';
  item.style.cursor = 'pointer';
  item.style.color = '#ff6b6b';
  item.style.transition = 'background 0.2s';
  item.addEventListener('mouseenter', () => item.style.background = '#3a4055');
  item.addEventListener('mouseleave', () => item.style.background = 'transparent');
  item.addEventListener('click', () => {
    if (confirm(`Удалить плейлист "${playlist.name}"?`)) {
      deletePlaylist(playlistId);
    }
    document.body.removeChild(menu);
  });
  menu.appendChild(item);

  document.body.appendChild(menu);

  let left = event.pageX;
  let top = event.pageY;

  if (left + menu.offsetWidth > window.innerWidth) {
    left = window.innerWidth - menu.offsetWidth - 5;
  }
  if (top + menu.offsetHeight > window.innerHeight) {
    top = window.innerHeight - menu.offsetHeight - 5;
  }

  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      if (document.body.contains(menu)) document.body.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

// Удаление плейлиста
function deletePlaylist(playlistId) {
  playlists = playlists.filter(p => p.id !== playlistId);
  savePlaylists();

  if (currentPlaylistId === playlistId) {
    currentView = 'music';
    currentPlaylistId = null;
    navItems.forEach(item => {
      if (item.dataset.view === 'music') {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    viewTitle.textContent = 'Музыка';
    updateSidebarVisibility();
    renderMusicLibrary();
  }

  renderPlaylistsList();
}

// Создание нового плейлиста (через модальное окно)
createPlaylistBtn.addEventListener('click', () => {
  newPlaylistInput.value = '';
  playlistModal.style.display = 'flex';
  newPlaylistInput.focus();
});

function createNewPlaylist() {
  const name = newPlaylistInput.value.trim();
  if (name) {
    const newPlaylist = {
      id: 'pl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: name,
      tracks: []
    };
    playlists.push(newPlaylist);
    savePlaylists();
    renderPlaylistsList();
    playlistModal.style.display = 'none';
  }
}

modalCreate.addEventListener('click', createNewPlaylist);

modalCancel.addEventListener('click', () => {
  playlistModal.style.display = 'none';
});

playlistModal.addEventListener('click', (e) => {
  if (e.target === playlistModal) {
    playlistModal.style.display = 'none';
  }
});

newPlaylistInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    createNewPlaylist();
  }
});

// Кнопка помощи / Что нового
helpButton.addEventListener('click', () => {
  helpModal.style.display = 'flex';
});

helpClose.addEventListener('click', () => {
  helpModal.style.display = 'none';
});

helpModal.addEventListener('click', (e) => {
  if (e.target === helpModal) {
    helpModal.style.display = 'none';
  }
});

// Выбор папки с музыкой
selectFolderBtn.addEventListener('click', async () => {
  const files = await window.electronAPI.selectFolder();
  if (files.length) {
    audioFiles = files;
    if (currentView === 'music') {
      renderMusicLibrary();
    }
  }
});

// Форматирование времени
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// События аудио
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('play', () => {
  isPlaying = true;
  playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
});

audio.addEventListener('pause', () => {
  isPlaying = false;
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});

audio.addEventListener('ended', () => {
  if (loopEnabled) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextBtn.click();
  }
});

// Перемотка
progressBar.addEventListener('input', () => {
  if (audio.duration) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }
});

// Громкость
volumeBar.addEventListener('input', (e) => {
  audio.volume = e.target.value;
});

// Кнопки управления
playPauseBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

stopBtn.addEventListener('click', () => {
  audio.pause();
  audio.currentTime = 0;
  currentTimeEl.textContent = '0:00';
  progressBar.value = 0;
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});

prevBtn.addEventListener('click', () => {
  if (currentView === 'music') {
    if (audioFiles.length > 0) {
      let prevIndex = currentTrackIndex - 1;
      if (prevIndex < 0) prevIndex = audioFiles.length - 1;
      playTrackFromMusic(prevIndex);
    }
  } else if (currentView === 'playlist' && currentPlaylistId) {
    const playlist = playlists.find(p => p.id === currentPlaylistId);
    if (playlist && playlist.tracks.length > 0) {
      let prevIndex = currentTrackIndex - 1;
      if (prevIndex < 0) prevIndex = playlist.tracks.length - 1;
      playTrackFromPlaylist(currentPlaylistId, prevIndex);
    }
  }
});

nextBtn.addEventListener('click', () => {
  if (currentView === 'music') {
    if (audioFiles.length > 0) {
      let nextIndex = (currentTrackIndex + 1) % audioFiles.length;
      playTrackFromMusic(nextIndex);
    }
  } else if (currentView === 'playlist' && currentPlaylistId) {
    const playlist = playlists.find(p => p.id === currentPlaylistId);
    if (playlist && playlist.tracks.length > 0) {
      let nextIndex = (currentTrackIndex + 1) % playlist.tracks.length;
      playTrackFromPlaylist(currentPlaylistId, nextIndex);
    }
  }
});

loopBtn.addEventListener('click', () => {
  loopEnabled = !loopEnabled;
  if (loopEnabled) {
    loopBtn.classList.add('active');
  } else {
    loopBtn.classList.remove('active');
  }
});

audio.addEventListener('play', highlightCurrentTrackInList);

if (audioFiles.length === 0) {
  renderMusicLibrary();
}