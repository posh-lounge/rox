import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Define the interface for session data
interface SessionData {
  fullname: string;
  email: string;
  session: string;

}

// Define the interface for the Redux state
interface DataState {
  sessiondata: SessionData | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Initial state
const initialState: DataState = {
  sessiondata: null,
  status: 'idle',
  error: null,
};
export const fetchSession = createAsyncThunk('data/fetchData', async () => {
  try {
    const response = await fetch('/api/main/support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: window.location.origin, // Pass the origin from the browser
      },
    });

    const responseData = await response.json();
   
    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to fetch data');
    }

    return responseData.sessiondata; // Return the sessiondata object
  } catch (error: any) {
    console.error("Error in fetchSession:", error.message);
    throw error;
  }
});


// Redux slice
const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {}, // No reducers in this case
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sessiondata = action.payload; // Update session data
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Something went wrong'; // Set error
      });
  },
});

// Export the reducer
export default dataSlice.reducer;
