import { createContext, useContext, useState, type PropsWithChildren } from 'react';

const ExamNavigationContext = createContext({ active: false, setActive: (_active: boolean) => {} });
export function ExamNavigationProvider({ children }: PropsWithChildren) {
  const [active, setActive] = useState(false);
  return <ExamNavigationContext.Provider value={{ active, setActive }}>{children}</ExamNavigationContext.Provider>;
}
export const useExamNavigation = () => useContext(ExamNavigationContext);
