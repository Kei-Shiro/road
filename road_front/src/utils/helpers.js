export const formatBudget = (amount) => {
  if (!amount) return 'Non défini';
  const numAmount = Number(amount);
  if (numAmount >= 1000000) {
    return (numAmount / 1000000).toFixed(1) + 'M Ar';
  }
  if (numAmount >= 1000) {
    return (numAmount / 1000).toFixed(0) + 'K Ar';
  }
  return numAmount.toLocaleString() + ' Ar';
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateProgress = (signalements) => {
  if (!signalements || signalements.length === 0) return 0;
  const totalProgress = signalements.reduce((sum, s) => sum + (s.pourcentageAvancement || 0), 0);
  return Math.round(totalProgress / signalements.length);
};

export const calculateStats = (signalements) => {
  const stats = {
    total: signalements.length,
    nouveau: 0,
    enCours: 0,
    termine: 0,
    totalSurface: 0,
    totalBudget: 0,
  };

  signalements.forEach((sig) => {
    if (sig.statut === 'NOUVEAU') stats.nouveau++;
    else if (sig.statut === 'EN_COURS') stats.enCours++;
    else if (sig.statut === 'TERMINE') stats.termine++;

    stats.totalSurface += sig.surfaceImpactee || 0;
    stats.totalBudget += Number(sig.budget || 0);
  });

  return stats;
};

