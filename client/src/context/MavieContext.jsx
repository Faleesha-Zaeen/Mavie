import { createContext, useContext, useMemo, useState } from 'react';

const MavieContext = createContext(null);

/**
 * Session state for one pass through the MAVIE journey.
 * Guest Mode lives here too: when on, nothing is persisted server-side.
 */
export function MavieProvider({ children }) {
  const [constraints, setConstraints] = useState(null);
  const [looks, setLooks] = useState([]);
  const [selectedLookId, setSelectedLookId] = useState(null);
  /**
   * Two photos, because the two features want opposite framing.
   *
   * Skin analysis needs the face large in frame — Perfect Corp rejects images
   * whose face is too small. Apparel try-on needs the whole body, since most
   * looks resolve to a dress or a full-body category. One upload cannot serve
   * both: a full-body shot gives a face too small to analyse, and a selfie has
   * no legs to put trousers on.
   */
  const [userImage, setUserImage] = useState(null); // selfie · skin analysis
  const [bodyImage, setBodyImage] = useState(null); // full body · try-on
  const [beauty, setBeauty] = useState(null);
  const [vtoResult, setVtoResult] = useState(null);
  const [decision, setDecision] = useState(null);
  const [guest, setGuest] = useState(false);

  const selectedLook = useMemo(
    () => looks.find((l) => l.id === selectedLookId) || looks[0] || null,
    [looks, selectedLookId],
  );

  const reset = () => {
    setConstraints(null);
    setLooks([]);
    setSelectedLookId(null);
    setVtoResult(null);
    setDecision(null);
  };

  const value = {
    constraints, setConstraints,
    looks, setLooks,
    selectedLookId, setSelectedLookId, selectedLook,
    userImage, setUserImage,
    bodyImage, setBodyImage,
    beauty, setBeauty,
    vtoResult, setVtoResult,
    decision, setDecision,
    guest, setGuest,
    reset,
  };

  return <MavieContext.Provider value={value}>{children}</MavieContext.Provider>;
}

export const useMavie = () => {
  const ctx = useContext(MavieContext);
  if (!ctx) throw new Error('useMavie must be used inside MavieProvider');
  return ctx;
};
