<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>Settings</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="modal-body">
        <div class="settings-group">
          <label class="settings-label">Display Options</label>
          
          <div class="setting-item">
            <label class="toggle-switch">
              <input type="checkbox" v-model="localSettings.showRomanization">
              <span class="toggle-slider"></span>
            </label>
            <span class="setting-name">Show Romanization</span>
          </div>
          
          <div class="setting-item">
            <label class="toggle-switch">
              <input type="checkbox" v-model="localSettings.showOriginalText">
              <span class="toggle-slider"></span>
            </label>
            <span class="setting-name">Show Original Urdu Text</span>
          </div>
          
          <div class="setting-item">
            <label class="toggle-switch">
              <input type="checkbox" v-model="localSettings.showEnglishTranslation">
              <span class="toggle-slider"></span>
            </label>
            <span class="setting-name">Show English Translation</span>
          </div>
        </div>

        <div class="settings-group">
          <label class="settings-label">Display Order</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" value="ur-en" v-model="localSettings.displayOrder">
              <span>Urdu First</span>
            </label>
            <label class="radio-item">
              <input type="radio" value="en-ur" v-model="localSettings.displayOrder">
              <span>English First</span>
            </label>
          </div>
        </div>

        <div class="settings-group">
          <label class="settings-label">Layout</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" :value="false" v-model="localSettings.interleaveLines">
              <span>Paragraph by Paragraph</span>
            </label>
            <label class="radio-item">
              <input type="radio" :value="true" v-model="localSettings.interleaveLines">
              <span>Interleave Lines</span>
            </label>
          </div>
        </div>

        <div class="settings-group">
          <label class="settings-label">Font Size: {{ localSettings.fontSize }}px</label>
          <input 
            type="range" 
            v-model="localSettings.fontSize" 
            min="12" 
            max="32" 
            step="1"
            class="font-slider"
          >
        </div>

        <div class="settings-group">
          <label class="settings-label">Urdu Font</label>
          <select v-model="localSettings.selectedFont" class="font-select">
            <option value="NotoNastaliqUrdu">Noto Nastaliq Urdu</option>
            <option value="JameelNoori">Jameel Noori Nastaleeq</option>
            <option value="NafeesWeb">Nafees Web</option>
            <option value="Arial">Arial</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="reset-btn" @click="resetSettings">Reset to Defaults</button>
        <button class="cancel-btn" @click="closeModal">Cancel</button>
        <button class="save-btn" @click="saveSettings">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'SettingsModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    settings: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'save', 'reset'],
  setup(props, { emit }) {
    const localSettings = ref({ ...props.settings });

    watch(() => props.settings, (newSettings) => {
      localSettings.value = { ...newSettings };
    }, { deep: true });

    const closeModal = () => {
      emit('close');
    };

    const saveSettings = () => {
      emit('save', localSettings.value);
    };

    const resetSettings = () => {
      emit('reset');
    };

    return {
      localSettings,
      closeModal,
      saveSettings,
      resetSettings
    };
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.settings-group {
  margin-bottom: 24px;
}

.settings-label {
  display: block;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1a1a1a;
  font-size: 14px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #4a6cf7;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.setting-name {
  font-size: 14px;
  color: #495057;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
}

.font-slider {
  width: 100%;
  margin-top: 8px;
}

.font-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
}

.reset-btn,
.cancel-btn,
.save-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn {
  background: none;
  border: 1px solid #dc2626;
  color: #dc2626;
  margin-right: auto;
}

.reset-btn:hover {
  background: #fee2e2;
}

.cancel-btn {
  background: white;
  border: 1px solid #dee2e6;
  color: #495057;
}

.cancel-btn:hover {
  background: #f8f9fa;
}

.save-btn {
  background: #4a6cf7;
  border: none;
  color: white;
}

.save-btn:hover {
  background: #3a5ce0;
}
</style>