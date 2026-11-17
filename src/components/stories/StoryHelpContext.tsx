import { createContext } from 'react';

export const StoryHelpContext = createContext<{ onOpen: () => void; onClose: () => void } | null>(null);
