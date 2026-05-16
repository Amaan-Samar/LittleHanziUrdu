<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="modal-body">
        <textarea
          ref="modalTextarea"
          v-model="editedContent"
          :style="{
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily
          }"
          :dir="isRtl ? 'rtl' : 'ltr'"
          class="modal-textarea"
        ></textarea>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="closeModal">Cancel</button>
        <button class="save-btn" @click="saveContent">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue';

export default {
  name: 'EditModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Edit Text'
    },
    content: {
      type: String,
      default: ''
    },
    fontSize: {
      type: Number,
      default: 16
    },
    fontFamily: {
      type: String,
      default: 'inherit'
    },
    isRtl: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const editedContent = ref(props.content);
    const modalTextarea = ref(null);

    watch(() => props.content, (newContent) => {
      editedContent.value = newContent;
    });

    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        editedContent.value = props.content;
        nextTick(() => {
          if (modalTextarea.value) {
            modalTextarea.value.focus();
          }
        });
      }
    });

    const closeModal = () => {
      emit('close');
    };

    const saveContent = () => {
      emit('save', editedContent.value);
    };

    return {
      editedContent,
      modalTextarea,
      closeModal,
      saveContent
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
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
  color: #1a1a1a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
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
  color: #1a1a1a;
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.modal-textarea {
  width: 100%;
  min-height: 300px;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-family: inherit;
  resize: vertical;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
}

.modal-textarea:focus {
  outline: none;
  border-color: #4a6cf7;
  box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
}

.cancel-btn,
.save-btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  border: 1px solid #dee2e6;
  color: #495057;
}

.cancel-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.save-btn {
  background: #4a6cf7;
  border: none;
  color: white;
}

.save-btn:hover {
  background: #3a5ce0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 108, 247, 0.3);
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .modal-textarea {
    min-height: 200px;
  }
}
</style>