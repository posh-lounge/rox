"use client"

import { Provider as ReduxProvider } from 'react-redux';
import store from '@/lib/redux/store';


export const StoreProvider = ({children} : {children : React.ReactNode}) =>{
   return <ReduxProvider store={store}> {children} </ReduxProvider>;
}