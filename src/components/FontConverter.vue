<template>
  <div class="converter-wrapper">
    <!-- Header with Logo and Settings -->
    <div class="app-header">
      <div class="logo-section">
        <h1 class="logo">LittleHanzi</h1>
        <span class="urdu-subtitle">اردو</span>
      </div>
      <button class="settings-icon-btn" @click="openSettingsModal" title="Settings">
        <Settings :size="24" />
      </button>
    </div>

    <div class="main-content">
      <div class="input-display-row">
        <!-- Urdu Text Input -->
        <div class="text-section" :style="{fontSize: `${fontSize}px` }">
          <div class="input-wrapper">
            <textarea 
              v-model="inputText" 
              placeholder="یہاں اردو متن درج کریں..." 
              class="text-input w-full urdu-input" 
              dir="rtl"
              @input="adjustHeight"
              ref="urduTextarea"
            ></textarea>
            <button 
              v-if="inputText.trim()" 
              @click="openEditModal" 
              class="edit-btn"
              title="Edit in popup"
            >
              <EditIcon :size="16" />
            </button>
          </div>
          <button @click="clearOrPasteText" class="action-btn">
            {{ inputText.trim() ? 'Clear' : 'Paste' }}
          </button>
        </div>

        <!-- English Translation Input (Optional) -->
        <div v-if="showEnglishTranslation" class="text-section" :style="{fontSize: `${fontSize}px` }">
          <div class="input-wrapper">
            <textarea 
              v-model="englishText" 
              placeholder="Enter translation here..." 
              class="text-input w-full english-input" 
              dir="ltr"
              @input="adjustEnglishHeight"
              ref="englishTextarea"
            ></textarea>
            <button 
              v-if="englishText.trim()" 
              @click="openEnglishEditModal" 
              class="edit-btn"
              title="Edit in popup"
            >
              <EditIcon :size="16" />
            </button>
          </div>
          <button @click="clearOrPasteEnglishText" class="action-btn">
            {{ englishText.trim() ? 'Clear' : 'Paste' }}
          </button>
        </div>
      </div>

      <!-- Edit Modal -->
      <EditModal
        :isOpen="isEditModalOpen"
        :title="editModalTitle"
        :content="editModalContent"
        :fontSize="Number(fontSize)"
        :fontFamily="getFontFamily"
        :isRtl="editModalType === 'urdu'"
        @close="closeEditModal"
        @save="saveEditModalContent"
      />

      <!-- Settings Modal -->
      <SettingsModal
        :isOpen="isSettingsModalOpen"
        :settings="settings"
        @close="closeSettingsModal"
        @save="saveSettings"
        @reset="resetToDefaults"
      />

      <!-- Main Display Area -->
      <div v-if="inputText.trim() && (showRomanization || showOriginalText || showEnglishTranslation)" class="comparison-section">
        <div class="comparison-display relative">
          <!-- Interleaved rendering only -->
          <div v-if="interleavedDisplayData && interleavedDisplayData.length" class="interleaved-container">
            <div v-for="(block, blockIndex) in interleavedDisplayData" :key="blockIndex" class="interleaved-block">
              <div v-for="(line, lineIndex) in block" :key="lineIndex" 
                   :class="['interleaved-line', line.type]"
                   :dir="line.type === 'urdu' ? 'rtl' : 'ltr'"
                   :style="{
                     fontSize: line.type === 'urdu' ? `${fontSize}px` : `${fontSize * 0.8}px`,
                     fontFamily: line.type === 'urdu' ? getFontFamily : '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif'
                   }">
                <span v-if="line.type === 'urdu'" v-html="line.content"></span>
                <span v-else>{{ line.content }}</span>
              </div>
            </div>
          </div>

          <div class="scroll-spacer" :style="{ minHeight: `calc(66vh - ${fontSize * 2}px)` }"></div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="inputText.trim() && !showRomanization && !showOriginalText && !showEnglishTranslation" class="empty-state">
        <p>All display options are hidden. Enable them in settings.</p>
      </div>

      <!-- Quick Actions -->
      <div v-if="inputText.trim()" class="quick-actions">
        <button @click="requestClearAll" class="clear-all-btn">
          Clear All Text
        </button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmModal
      :isOpen="showConfirmModal"
      title="Clear All Text"
      message="Are you sure you want to clear all Urdu and English text? This action cannot be undone."
      confirmText="Yes, Clear All"
      cancelText="Cancel"
      @confirm="confirmClearAll"
      @cancel="cancelClearAll"
    />
  </div>
</template>

<script>
import { Edit as EditIcon, Settings } from 'lucide-vue-next';
import EditModal from './EditModal.vue';
import ConfirmModal from './ConfirmModal.vue';
import SettingsModal from './SettingsModal.vue';
import { ref, computed, watch, nextTick } from 'vue';
import { getWordRomanizationPairs, splitUrduWords } from '../utils/urduRomanizer.js';

export default {
  components: {
    EditModal,
    ConfirmModal,
    SettingsModal,
    EditIcon,
    Settings,
  },
  name: 'UrduConverter',
  setup() {
    // State
    const inputText = ref('');
    const englishText = ref('');
    const urduTextarea = ref(null);
    const englishTextarea = ref(null);
    const showConfirmModal = ref(false);
    const isSettingsModalOpen = ref(false);
    const isEditModalOpen = ref(false);
    const editModalType = ref('urdu');
    const containerWidth = ref(800);

    // Settings
    const fontSize = ref(16);
    const selectedFont = ref('NotoNastaliqUrdu');
    const showRomanization = ref(true);
    const showOriginalText = ref(true);
    const showEnglishTranslation = ref(true);
    const displayOrder = ref('en-ur');
    const romanizationPosition = ref('left');

    // Computed
    const editModalTitle = computed(() => editModalType.value === 'urdu' ? 'Urdu Text' : 'English Translation');
    const editModalContent = computed(() => editModalType.value === 'urdu' ? inputText.value : englishText.value);

    const getFontFamily = computed(() => {
      const fonts = {
        NotoNastaliqUrdu: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Alvi Nastaleeq', 'Urdu Typesetting', serif",
        JameelNoori: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif",
        NafeesWeb: "'Nafees Web', 'Noto Nastaliq Urdu', serif",
        Arial: "Arial, 'Noto Nastaliq Urdu', sans-serif"
      };
      return fonts[selectedFont.value] || fonts.NotoNastaliqUrdu;
    });

    // Settings object for modal
    const settings = computed(() => ({
      fontSize: Number(fontSize.value),
      selectedFont: selectedFont.value,
      showRomanization: showRomanization.value,
      showOriginalText: showOriginalText.value,
      showEnglishTranslation: showEnglishTranslation.value,
      displayOrder: displayOrder.value,
      interleaveLines: true, // Always true now
      romanizationPosition: romanizationPosition.value
    }));

    // Split text into lines for interleaved mode
    const splitTextIntoLines = (text, width, fontSz, fontFamily, isUrdu = false) => {
      if (!text || !width || width <= 0) return [text];
      
      const measureDiv = document.createElement('div');
      measureDiv.style.position = 'absolute';
      measureDiv.style.visibility = 'hidden';
      measureDiv.style.top = '-9999px';
      measureDiv.style.left = '-9999px';
      measureDiv.style.width = `${width}px`;
      measureDiv.style.fontSize = `${fontSz}px`;
      measureDiv.style.fontFamily = fontFamily;
      measureDiv.style.lineHeight = '1.5';
      measureDiv.style.whiteSpace = 'pre-wrap';
      measureDiv.style.wordWrap = 'break-word';
      measureDiv.style.wordBreak = 'break-word';
      measureDiv.style.padding = '0';
      measureDiv.style.margin = '0';
      document.body.appendChild(measureDiv);
      
      const lines = [];
      let currentLine = '';
      
      let segments = [];
      if (isUrdu) {
        segments = splitUrduWords(text);
      } else {
        segments = text.split(/(\s+)/);
      }
      
      for (const segment of segments) {
        const testLine = currentLine + segment;
        measureDiv.textContent = testLine;
        
        if (measureDiv.scrollHeight > 35) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = segment;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      
      document.body.removeChild(measureDiv);
      return lines;
    };

    // Process paragraphs from input text
    const processParagraphs = () => {
      if (!inputText.value.trim()) return [];
      
      // Split into paragraphs
      let paragraphs = inputText.value.split(/\n\n+/);
      if (paragraphs.length === 1) {
        paragraphs = inputText.value.split(/\n+/);
      }
      paragraphs = paragraphs.filter(p => p.trim());
      
      const englishParagraphs = englishText.value ? 
        englishText.value.split(/\n\n+/).filter(p => p.trim()) : [];
      
      return paragraphs.map((paragraph, index) => ({
        urdu: paragraph,
        english: englishParagraphs[index] || ''
      }));
    };

    // Generate HTML for Urdu with inline romanization
    const getUrduWithRomanizationHTML = (paragraph) => {
      if (!paragraph) return '';
      const pairs = getWordRomanizationPairs(paragraph);
      return pairs.map(item => {
        if (item.isSpace) return ' ';
        if (item.romanized && showRomanization.value) {
          return `<span class="urdu-with-romanization">${item.word}<span class="inline-romanization">${item.romanized}</span></span>`;
        }
        return item.word;
      }).join('');
    };

    // Interleaved display data
    const interleavedDisplayData = computed(() => {
      if (!inputText.value.trim()) return null;
      
      const blocks = processParagraphs();
      
      nextTick(() => updateContainerWidth());
      
      const interleavedBlocks = [];
      
      for (const block of blocks) {
        const interleaved = [];
        
        let urduLines = [];
        let englishLines = [];
        
        if (showOriginalText.value && block.urdu) {
          const plainUrdu = block.urdu;
          urduLines = splitTextIntoLines(
            plainUrdu,
            containerWidth.value,
            fontSize.value,
            getFontFamily.value,
            true
          );
        }
        
        if (showEnglishTranslation.value && block.english) {
          englishLines = splitTextIntoLines(
            block.english,
            containerWidth.value,
            fontSize.value * 0.8,
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            false
          );
        }
        
        const maxLines = Math.max(urduLines.length, englishLines.length);
        
        if (displayOrder.value === 'en-ur') {
          for (let i = 0; i < maxLines; i++) {
            if (i < englishLines.length && showEnglishTranslation.value) {
              interleaved.push({ type: 'english', content: englishLines[i] });
            }
            if (i < urduLines.length && showOriginalText.value) {
              const lineHtml = getUrduWithRomanizationHTML(urduLines[i]);
              interleaved.push({ type: 'urdu', content: lineHtml });
            }
          }
        } else {
          for (let i = 0; i < maxLines; i++) {
            if (i < urduLines.length && showOriginalText.value) {
              const lineHtml = getUrduWithRomanizationHTML(urduLines[i]);
              interleaved.push({ type: 'urdu', content: lineHtml });
            }
            if (i < englishLines.length && showEnglishTranslation.value) {
              interleaved.push({ type: 'english', content: englishLines[i] });
            }
          }
        }
        
        if (interleaved.length) {
          interleavedBlocks.push(interleaved);
        }
      }
      
      return interleavedBlocks;
    });

    // Update container width
    const updateContainerWidth = () => {
      const container = document.querySelector('.comparison-display');
      if (container) {
        containerWidth.value = container.clientWidth - 32;
      }
    };

    // Text operations
    const pasteFromClipboard = async () => {
      try {
        const clipboardText = await navigator.clipboard.readText();
        inputText.value = clipboardText;
      } catch (error) {
        console.error('Failed to read clipboard contents: ', error);
      }
    };

    const pasteEnglishFromClipboard = async () => {
      try {
        const clipboardText = await navigator.clipboard.readText();
        englishText.value = clipboardText;
      } catch (error) {
        console.error('Failed to read clipboard contents: ', error);
      }
    };

    const clearText = () => {
      inputText.value = '';
      if (urduTextarea.value) {
        setTimeout(() => {
          urduTextarea.value.style.height = 'auto';
          urduTextarea.value.style.height = '70px';
        }, 0);
      }
    };

    const clearEnglishText = () => {
      englishText.value = '';
      if (englishTextarea.value) {
        setTimeout(() => {
          englishTextarea.value.style.height = 'auto';
          englishTextarea.value.style.height = '70px';
        }, 0);
      }
    };

    const clearOrPasteText = () => {
      if (inputText.value.trim()) {
        clearText();
      } else {
        pasteFromClipboard();
      }
    };

    const clearOrPasteEnglishText = () => {
      if (englishText.value.trim()) {
        clearEnglishText();
      } else {
        pasteEnglishFromClipboard();
      }
    };

    const requestClearAll = () => {
      if (inputText.value.trim() || englishText.value.trim()) {
        showConfirmModal.value = true;
      }
    };

    const confirmClearAll = () => {
      clearText();
      clearEnglishText();
      showConfirmModal.value = false;
    };

    const cancelClearAll = () => {
      showConfirmModal.value = false;
    };

    // Adjust textarea height
    const adjustHeight = () => {
      if (urduTextarea.value) {
        urduTextarea.value.style.height = 'auto';
        urduTextarea.value.style.height = `${urduTextarea.value.scrollHeight}px`;
      }
    };

    const adjustEnglishHeight = () => {
      if (englishTextarea.value) {
        englishTextarea.value.style.height = 'auto';
        englishTextarea.value.style.height = `${englishTextarea.value.scrollHeight}px`;
      }
    };

    // Modal operations
    const openSettingsModal = () => {
      isSettingsModalOpen.value = true;
    };

    const closeSettingsModal = () => {
      isSettingsModalOpen.value = false;
    };

    const saveSettings = (newSettings) => {
      fontSize.value = newSettings.fontSize;
      selectedFont.value = newSettings.selectedFont;
      showRomanization.value = newSettings.showRomanization;
      showOriginalText.value = newSettings.showOriginalText;
      showEnglishTranslation.value = newSettings.showEnglishTranslation;
      displayOrder.value = newSettings.displayOrder;
      romanizationPosition.value = newSettings.romanizationPosition;
      closeSettingsModal();
      nextTick(() => updateContainerWidth());
    };

    const resetToDefaults = () => {
      fontSize.value = 18;
      selectedFont.value = 'NotoNastaliqUrdu';
      showRomanization.value = true;
      showOriginalText.value = true;
      showEnglishTranslation.value = true;
      displayOrder.value = 'en-ur';
      romanizationPosition.value = 'left';
      closeSettingsModal();
    };

    const openEditModal = () => {
      editModalType.value = 'urdu';
      isEditModalOpen.value = true;
    };

    const openEnglishEditModal = () => {
      editModalType.value = 'english';
      isEditModalOpen.value = true;
    };

    const closeEditModal = () => {
      isEditModalOpen.value = false;
    };

    const saveEditModalContent = (newContent) => {
      if (editModalType.value === 'urdu') {
        inputText.value = newContent;
      } else {
        englishText.value = newContent;
      }
      closeEditModal();
    };

    // Watch for changes
    watch([inputText, englishText, fontSize, showRomanization, showOriginalText], () => {
      nextTick(() => updateContainerWidth());
    });

    watch(inputText, adjustHeight);
    watch(englishText, adjustEnglishHeight);

    // Set up resize observer
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        updateContainerWidth();
      });
    }

    return {
      // Data
      inputText,
      englishText,
      fontSize,
      selectedFont,
      showRomanization,
      showOriginalText,
      showEnglishTranslation,
      displayOrder,
      
      // Computed
      getFontFamily,
      settings,
      interleavedDisplayData,
      editModalTitle,
      editModalContent,
      
      // Refs
      urduTextarea,
      englishTextarea,
      
      // Modal states
      isEditModalOpen,
      isSettingsModalOpen,
      showConfirmModal,
      editModalType,
      
      // Methods
      clearOrPasteText,
      clearOrPasteEnglishText,
      requestClearAll,
      confirmClearAll,
      cancelClearAll,
      adjustHeight,
      adjustEnglishHeight,
      openSettingsModal,
      closeSettingsModal,
      saveSettings,
      resetToDefaults,
      openEditModal,
      openEnglishEditModal,
      closeEditModal,
      saveEditModalContent,
      romanizationPosition,
      
      // Icons
      EditIcon,
      Settings,
    };
  },
};
</script>

<style scoped>
/* Keep all your existing styles, just remove any unused ones */
/* The styles remain the same as they already support both modes */

/* Note: You can remove the .comparison-block, .urdu-text-container, 
   .english-translation-box styles if they're not used elsewhere, 
   but they don't hurt to keep */

/* All other styles remain unchanged */
@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');

.app-header {
  position: sticky;
  top: 0;
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.logo-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, #4a6cf7 0%, #6c5ce7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.urdu-subtitle {
  font-size: 18px;
  color: #4a6cf7;
  font-family: 'Noto Nastaliq Urdu', serif;
}

.settings-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #495057;
}

.settings-icon-btn:hover {
  background: #f8f9fa;
  transform: rotate(90deg);
}

.main-content {
  display: block;
}

.input-display-row {
  margin: 20px auto;
  padding: 5px;
  display: block;
  width: 100%;
  max-width: 1200px;
}

.text-section {
  width: 100%;
  padding: 0 1rem;
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.text-input {
  width: 100%;
  min-height: 40px;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;
  resize: vertical;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.text-input:focus {
  outline: none;
  border-color: #4a6cf7;
  box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
}

.urdu-input {
  font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
  font-size: 16px;
}

.english-input {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border-color: #5dade2 !important;
}

.action-btn {
  padding: 8px 20px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f8f9fa;
  border-color: #4a6cf7;
  color: #4a6cf7;
}

.edit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #6c757d;
  z-index: 10;
}

.edit-btn:hover {
  background: #4a6cf7;
  border-color: #4a6cf7;
  color: white;
  transform: scale(1.05);
}

.quick-actions {
  max-width: 1200px;
  margin: 20px auto;
  text-align: center;
}

.clear-all-btn {
  padding: 8px 20px;
  font-weight: 600;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #868e96;
  font-style: italic;
}

.converter-wrapper {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.comparison-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  overflow-x: hidden;
}

.comparison-display {
  max-width: 100%;
  width: 100%;
  overflow-x: hidden;
}

/* Interleaved mode styles */
.interleaved-container {
  width: 100%;
}

.interleaved-block {
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.interleaved-line {
  padding: 8px 0;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
  word-break: break-word;
}

.interleaved-line.urdu {
  font-weight: 500;
  color: #1a1a1a;
}

.interleaved-line.english {
  color: #5dade2;
}

/* Inline romanization styling for interleaved mode */
.urdu-with-romanization {
  display: inline-block;
  text-align: center;
}

.inline-romanization {
  display: block;
  font-size: 0.65em;
  color: #4a6cf7;
  margin-top: 2px;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* RTL support */
[dir="rtl"] {
  text-align: right;
  direction: rtl;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .app-header {
    padding: 8px 16px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .urdu-subtitle {
    font-size: 14px;
  }
  
  .input-display-row {
    margin: 10px auto;
  }
  
  .text-section {
    padding: 0 0.5rem;
  }
  
  .comparison-section {
    padding: 0 0.5rem;
  }
}

@media (max-width: 480px) {
  .interleaved-block {
    padding: 12px;
  }
}
</style>