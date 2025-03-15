import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Participant {
  address: string;
  recipient: string;
  signedMessage?: string;
}

interface QueueState {
  queue: Participant[];
  queueError: string | null;
  isQueueModalOpen: boolean;
}

const initialState: QueueState = {
  queue: [],
  queueError: null,
  isQueueModalOpen: false,
};

export const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    setQueue: (state, action: PayloadAction<Participant[]>) => {
      state.queue = action.payload;
    },
    setQueueError: (state, action: PayloadAction<string | null>) => {
      state.queueError = action.payload;
    },
    setIsQueueModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isQueueModalOpen = action.payload;
    },
  },
});

export const {
  setQueue,
  setQueueError,
  setIsQueueModalOpen,
} = queueSlice.actions;

export default queueSlice.reducer; 