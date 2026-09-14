import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  /** Global loading overlay (e.g. full-page spinner during auth init). */
  globalLoading: boolean;
  /** Banner message shown at the top of the page. null = hidden. */
  banner: { message: string; variant: "info" | "success" | "warning" | "error" } | null;
}

const initialState: UiState = {
  globalLoading: false,
  banner: null,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
    showBanner(state, action: PayloadAction<UiState["banner"]>) {
      state.banner = action.payload;
    },
    hideBanner(state) {
      state.banner = null;
    },
  },
});

export const { setGlobalLoading, showBanner, hideBanner } = uiSlice.actions;
export default uiSlice.reducer;
