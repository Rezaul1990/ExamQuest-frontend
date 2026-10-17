import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import type { ImportedPaperSource } from './paperAuthoring.helpers';

const PaperSourceContext = createContext<{ source?: ImportedPaperSource; setSource: (source?: ImportedPaperSource) => void }>({ setSource: () => {} });
export function PaperSourceProvider({ children }: PropsWithChildren) {
  const [source, setSource] = useState<ImportedPaperSource>();
  return <PaperSourceContext.Provider value={{ source, setSource }}>{children}</PaperSourceContext.Provider>;
}
export const usePaperSource = () => useContext(PaperSourceContext);
