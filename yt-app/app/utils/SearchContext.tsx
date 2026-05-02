'use client';
import { createContext, useContext } from 'react';

export const SearchContext = createContext<string>('');

export const useSearch = () => useContext(SearchContext);