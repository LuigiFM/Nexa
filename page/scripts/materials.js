/* Browser-only attachments. No network requests or changes to the API payload. */
window.materialAttachments = (() => {
  const maxSize = 20 * 1024 * 1024;
  const typeInput = document.querySelector('#material-type');
  const dialog = document.querySelector('#material-dialog');
  const body = document.querySelector('#material-dialog-body');
  const actions = document.querySelector('#material-dialog-actions');
  const errorBox = document.querySelector('#material-dialog-error');
  let account = null;
  let materials = [];
  let database;
  let objectUrls = [];
  let dialogVersion = 0;
  let notify = () => {};

  function openDatabase() {
    if (!database) database = new Promise((resolve, reject) => {
      const request = indexedDB.open('nexa-material-content', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('attachments', { keyPath: 'key' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Não foi possível acessar o armazenamento deste navegador.'));
    }).catch(error => { database = null; throw error; });
    return database;
  }

  async function storage(mode, operation) {
    if (!account) throw new Error('Aguarde o carregamento da sua conta.');
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('attachments', mode);
      const request = operation(transaction.objectStore('attachments'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () => reject(new Error('Não foi possível salvar ou ler o conteúdo local. Verifique o espaço disponível no navegador.'));
    });
  }
  const key = id => JSON.stringify([account, String(id)]);
  const read = id => storage('readonly', store => store.get(key(id)));
  const save = (id, content) => storage('readwrite', store => store.put({ key: key(id), ...content }));
  const remove = id => storage('readwrite', store => store.delete(key(id)));

  function makeEditor(container, prefix) {
    container.innerHTML = `
      <div class="attachment-fields" hidden>
        <div class="attachment-file-group" hidden>
          <label class="upload-zone" for="${prefix}-file"><span class="upload-symbol" aria-hidden="true">↑</span><strong>Escolher arquivo</strong><span class="upload-hint">ou arraste e solte aqui</span><input id="${prefix}-file" type="file" aria-describedby="${prefix}-file-help"></label>
          <p class="attachment-help" id="${prefix}-file-help"></p>
          <div class="selected-file" hidden><span class="selected-file-name"></span><button type="button" class="remove-file">Remover</button></div>
        </div>
        <label class="attachment-url-group" hidden>Endereço do material<input id="${prefix}-url" type="url" placeholder="https://exemplo.com/material" autocomplete="off"></label>
        <label class="attachment-text-group" hidden>Conteúdo<textarea id="${prefix}-text" rows="6" maxlength="100000" placeholder="Cole ou escreva seu conteúdo de estudo..."></textarea></label>
        <p class="attachment-error material-error" role="alert" hidden></p>
      </div>`;
    const fields = container.querySelector('.attachment-fields');
    const fileGroup = container.querySelector('.attachment-file-group');
    const fileInput = container.querySelector('input[type=file]');
    const url = container.querySelector('input[type=url]');
    const text = container.querySelector('textarea');
    const zone = container.querySelector('.upload-zone');
    const selected = container.querySelector('.selected-file');
    const error = container.querySelector('.attachment-error');
    let file = null;
    let type = '';
    let selectionVersion = 0;
    const fail = message => { error.textContent = message; error.hidden = !message; };
    const displayFile = () => {
      selected.hidden = !file;
      container.querySelector('.selected-file-name').textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : '';
    };
    async function chooseFile(candidate) {
      const version = ++selectionVersion;
      fail(''); file = null; displayFile();
      try {
        if (!candidate) return;
        if (!candidate.size) throw new Error('O arquivo está vazio. Escolha outro arquivo.');
        if (candidate.size > maxSize) throw new Error('Escolha um arquivo de até 20 MB.');
        if (type === 'PDF') {
          const signature = await candidate.slice(0, 5).text();
          if (!candidate.name.toLowerCase().endsWith('.pdf') || signature !== '%PDF-') throw new Error('Escolha um arquivo PDF válido.');
        }
        if (version !== selectionVersion) return;
        file = candidate; displayFile();
      } catch (e) { if (version === selectionVersion) { fileInput.value = ''; fail(e.message); } }
    }
    fileInput.addEventListener('change', () => chooseFile(fileInput.files[0]));
    container.querySelector('.remove-file').addEventListener('click', () => { selectionVersion++; file = null; fileInput.value = ''; displayFile(); fail(''); fileInput.focus(); });
    zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('is-dragging'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-dragging'));
    zone.addEventListener('drop', event => {
      event.preventDefault(); zone.classList.remove('is-dragging');
      if (event.dataTransfer.files.length !== 1) { fail('Adicione um arquivo por material.'); return; }
      chooseFile(event.dataTransfer.files[0]);
    });
    function configure(value, content) {
      selectionVersion++; type = value; file = content?.file || null;
      fields.hidden = !type;
      const isFile = type === 'PDF' || type === 'Outro';
      fileGroup.hidden = !isFile;
      url.parentElement.hidden = type !== 'Link';
      text.parentElement.hidden = type !== 'Resumo' && type !== 'Anotações';
      fileInput.disabled = !isFile; fileInput.value = ''; fileInput.accept = type === 'PDF' ? '.pdf,application/pdf' : '';
      url.disabled = type !== 'Link'; text.disabled = text.parentElement.hidden;
      url.required = !url.disabled; text.required = !text.disabled;
      url.value = content?.url || ''; text.value = content?.text || '';
      container.querySelector('.attachment-help').textContent = type === 'PDF' ? 'Arquivo PDF · até 20 MB' : 'Um arquivo de até 20 MB. Você poderá baixá-lo pela lista.';
      displayFile(); fail('');
    }
    function capture() {
      fail('');
      if (type === 'PDF' || type === 'Outro') {
        if (!file) { fail('Selecione um arquivo antes de continuar.'); fileInput.focus(); return null; }
        return { kind: 'file', file, name: file.name, mime: type === 'PDF' ? 'application/pdf' : file.type };
      }
      if (type === 'Link') {
        try {
          const address = new URL(url.value.trim());
          if (!['http:', 'https:'].includes(address.protocol)) throw new Error();
          return { kind: 'link', url: address.href };
        } catch { fail('Informe um link completo começando com https:// ou http://.'); url.focus(); return null; }
      }
      if (!text.value.trim()) { fail('Escreva ou cole o conteúdo do material.'); text.focus(); return null; }
      return { kind: 'text', text: text.value.trim() };
    }
    return { configure, capture };
  }

  const inlineEditor = makeEditor(document.querySelector('#material-content-fields'), 'new-material');
  typeInput.addEventListener('change', () => inlineEditor.configure(typeInput.value));
  document.querySelector('#material-form').addEventListener('reset', () => inlineEditor.configure(''));
  inlineEditor.configure('');

  function clearPreview() {
    body.replaceChildren(); actions.replaceChildren(); errorBox.hidden = true;
    objectUrls.forEach(url => URL.revokeObjectURL(url)); objectUrls = [];
  }
  function blobUrl(blob) { const url = URL.createObjectURL(blob); objectUrls.push(url); return url; }
  function action(label, handler) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', handler); actions.append(button); return button; }
  function link(label, href, download) {
    const anchor = document.createElement('a'); anchor.textContent = label; anchor.href = href;
    if (download) anchor.download = download;
    else { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
    actions.append(anchor); return anchor;
  }
  function dialogError(message) { errorBox.textContent = message; errorBox.hidden = false; }
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { dialogVersion++; clearPreview(); });

  async function openMaterial(material) {
    const version = ++dialogVersion;
    clearPreview();
    document.querySelector('#material-dialog-title').textContent = material.title || 'Material';
    document.querySelector('#material-dialog-type').textContent = material.type || 'Outro';
    body.textContent = 'Carregando conteúdo...';
    if (!dialog.open) dialog.showModal();
    try {
      const content = await read(material.id);
      if (version !== dialogVersion) return;
      if (!content) { editMaterial(material); return; }
      clearPreview();
      if (content.kind === 'text') {
        const article = document.createElement('article'); article.className = 'material-text-preview'; article.textContent = content.text; body.append(article);
        link('Baixar texto', blobUrl(new Blob([content.text], { type: 'text/plain;charset=utf-8' })), `${material.title || 'material'}.txt`);
      } else if (content.kind === 'link') {
        const address = new URL(content.url);
        if (!['https:', 'http:'].includes(address.protocol)) throw new Error('Este endereço não é válido.');
        const preview = document.createElement('p'); preview.className = 'material-link-preview'; preview.textContent = address.href; body.append(preview);
        link('Abrir link ↗', address.href);
      } else {
        const url = blobUrl(content.file);
        if (content.mime === 'application/pdf') {
          const frame = document.createElement('iframe'); frame.src = url; frame.title = `Prévia de ${material.title}`; frame.className = 'material-pdf-preview'; body.append(frame);
        } else if (['image/png','image/jpeg','image/webp','image/gif'].includes(content.mime)) {
          const image = document.createElement('img'); image.src = url; image.alt = material.title; image.className = 'material-image-preview'; body.append(image);
        } else {
          const message = document.createElement('p'); message.className = 'material-file-preview'; message.textContent = `${content.name} — pronto para baixar.`; body.append(message);
        }
        link('Baixar arquivo', url, content.name);
      }
      action('Alterar conteúdo', () => editMaterial(material, content));
    } catch (e) { if (version === dialogVersion) { body.textContent = ''; dialogError(e.message); } }
  }

  function editMaterial(material, content) {
    clearPreview();
    const form = document.createElement('form'); form.className = 'material-edit-form';
    const editor = makeEditor(form, 'edit-material'); editor.configure(material.type || 'Outro', content);
    const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Salvar neste navegador'; form.append(submit); body.append(form);
    form.addEventListener('submit', async event => {
      event.preventDefault(); const draft = editor.capture(); if (!draft) return;
      submit.disabled = true;
      try { await save(material.id, draft); refreshButtons(material.id); await openMaterial(material); }
      catch (e) { dialogError(e.message); }
      finally { submit.disabled = false; }
    });
  }

  async function decorate(copy, material) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'open-material-button'; button.dataset.materialId = material.id;
    button.textContent = 'Abrir / adicionar conteúdo'; button.addEventListener('click', () => openMaterial(material)); copy.append(button);
    try { const content = await read(material.id); button.textContent = content ? 'Abrir material ↗' : 'Adicionar conteúdo +'; }
    catch { button.textContent = 'Adicionar conteúdo +'; }
  }
  function refreshButtons(id) {
    document.querySelectorAll('.open-material-button').forEach(button => { if (button.dataset.materialId === String(id)) button.textContent = 'Abrir material ↗'; });
  }
  return {
    init: callback => { notify = callback; },
    setAccount: user => { account = user.id != null ? `id:${user.id}` : `user:${user.username}`; },
    setMaterials: value => { materials = value; },
    decorate,
    capture: async () => {
      const content = inlineEditor.capture(); if (!content) return null;
      try { await openDatabase(); if (!account) throw new Error('Aguarde o carregamento da sua conta.'); }
      catch (e) { notify(e.message); return null; }
      return { content, previousIds: new Set(materials.map(item => String(item.id))) };
    },
    saveNew: async (items, draft, metadata) => {
      const candidates = items.filter(item => !draft.previousIds.has(String(item.id)) && item.title === metadata.title && item.type === metadata.type);
      if (candidates.length !== 1 || candidates[0].id == null) throw new Error('Material cadastrado, mas não foi possível associar o conteúdo. Use “Adicionar conteúdo” no material desejado.');
      await save(candidates[0].id, draft.content); refreshButtons(candidates[0].id);
    },
    remove: async id => { try { await remove(id); } catch { /* A stale local record is harmless; never undo a server deletion. */ } }
  };
})();
