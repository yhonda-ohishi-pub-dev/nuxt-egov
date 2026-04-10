<script setup lang="ts">
const { loading, error, letters, forms, csvFiles, processFile, reset } = useDocumentViewer()

const fileInput = ref<HTMLInputElement>()
const dragover = ref(false)

function onDrop(e: DragEvent) {
  dragover.value = false
  const file = e.dataTransfer?.files[0]
  if (file) processFile(file)
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function handleReset() {
  reset()
  if (fileInput.value) fileInput.value.value = ''
}

// iframe 高さ自動調整
function onLetterLoad(e: Event) {
  const iframe = e.target as HTMLIFrameElement
  try {
    const height = iframe.contentDocument?.documentElement.scrollHeight
    if (height) iframe.style.height = `${height + 32}px`
  } catch {
    // cross-origin の場合は無視
  }
}

// フォーム iframe のスケール計算
const formContainerRef = ref<HTMLElement>()
const formScale = ref(1)

function updateFormScale() {
  const w = formContainerRef.value?.clientWidth ?? 1121
  formScale.value = Math.min(1, w / 1121)
}

onMounted(() => {
  updateFormScale()
  window.addEventListener('resize', updateFormScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateFormScale)
})
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>公文書ビューア</h1>
      <NuxtLink to="/" class="btn btn-secondary">
        申請状況チェック
      </NuxtLink>
    </div>

    <!-- アップロードエリア -->
    <div
      v-if="!letters.length && !forms.length && !loading"
      class="upload-zone"
      :class="{ dragover }"
      @dragover.prevent="dragover = true"
      @dragleave="dragover = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".zip"
        hidden
        @change="onFileChange"
      >
      <p class="upload-icon">
        📂
      </p>
      <p class="upload-text">
        ZIPファイルをドロップまたはクリックして選択
      </p>
      <p class="upload-hint">
        e-Gov公文書ZIPファイル（二重ZIP対応）
      </p>
    </div>

    <!-- ローディング -->
    <div v-if="loading" class="loading">
      処理中...
    </div>

    <!-- エラー -->
    <p v-if="error" class="error">
      {{ error }}
    </p>

    <!-- 結果表示 -->
    <div v-if="letters.length || forms.length">
      <button class="btn btn-secondary reset-btn" @click="handleReset">
        別のファイルを開く
      </button>

      <!-- 通知書 -->
      <section v-for="(doc, i) in letters" :key="`letter-${i}`" class="doc-section">
        <h2>通知書</h2>
        <iframe
          :srcdoc="doc.renderedHtml"
          class="letter-frame"
          @load="onLetterLoad"
        />
      </section>

      <!-- 申請書フォーム -->
      <section v-for="(doc, i) in forms" :key="`form-${i}`" class="doc-section">
        <h2>申請書データ</h2>
        <div ref="formContainerRef" class="form-container">
          <iframe
            :srcdoc="doc.renderedHtml"
            class="form-frame"
            width="1121"
            height="793"
            :style="{
              transform: `scale(${formScale})`,
              transformOrigin: 'top left',
            }"
          />
        </div>
      </section>

      <!-- CSV -->
      <section v-if="csvFiles.length" class="doc-section">
        <h2>添付データ (CSV)</h2>
        <div v-for="(csv, i) in csvFiles" :key="`csv-${i}`" class="csv-section">
          <h3>{{ csv.fileName }}</h3>
          <pre class="csv-content">{{ csv.content }}</pre>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.upload-zone {
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  padding: 4rem 2rem;
  text-align: center;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s, background 0.2s;
}

.upload-zone:hover,
.upload-zone.dragover {
  border-color: #2b6cb0;
  background: #ebf8ff;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.upload-hint {
  font-size: 0.85rem;
  color: #a0aec0;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #4a5568;
  font-size: 1.1rem;
}

.reset-btn {
  margin-bottom: 1.5rem;
}

.doc-section {
  margin-bottom: 2rem;
}

.doc-section h2 {
  font-size: 1.1rem;
  color: #2d3748;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.letter-frame {
  width: 100%;
  min-height: 300px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #fff;
}

.form-container {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #fff;
}

.form-frame {
  border: none;
  display: block;
}

.csv-section h3 {
  font-size: 0.9rem;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.csv-content {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.8rem;
  line-height: 1.5;
}
</style>
