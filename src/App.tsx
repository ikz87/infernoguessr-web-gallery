import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, ChevronLeft, Clock, ThumbsUp } from 'lucide-react';
import { supabase } from './lib/supabase';
import './App.css';

interface Level {
  id: string;
  level_number: string;
  level_name: string;
}

interface Submission {
  id: number;
  level_id: string;
  image_url: string;
  discord_name: string;
  discord_avatar_url: string;
  thumbs_up: number;
  created_at: string;
  storage_path: string;
}

function App() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: levelsData } = await supabase
        .from('levels')
        .select('*')
        .order('level_number');

      const { data: subsData } = await supabase
        .from('image_submissions')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (levelsData) setLevels(levelsData);
      if (subsData) setSubmissions(subsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredSubmissions = selectedLevelId
    ? submissions.filter(s => s.level_id === selectedLevelId)
    : [];

  const selectedLevel = levels.find(l => l.id === selectedLevelId);

  const submissionCounts = submissions.reduce((acc, sub) => {
    acc[sub.level_id] = (acc[sub.level_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const levelWithSubmissions = levels.map(l => {
    const previewSub = submissions.find(s => s.level_id === l.id);
    const previewUrl = previewSub
      ? (previewSub.storage_path
        ? supabase.storage.from('level-images').getPublicUrl(previewSub.storage_path).data.publicUrl
        : previewSub.image_url)
      : undefined;

    return {
      ...l,
      count: submissionCounts[l.id] || 0,
      previewUrl
    };
  });

  if (loading) {
    return (
      <div className="loading-screen">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="brand-logo"
        >
          InfernoGuessr
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="site-header site-container">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          InfernoGuessr Gallery
        </motion.h1>
      </header>

      <main className="site-container main-content">
        <AnimatePresence mode="wait">
          {!selectedLevelId ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="levels-grid"
            >
              {levelWithSubmissions.map((level) => (
                <motion.div
                  key={level.id}
                  layoutId={level.id}
                  onClick={() => setSelectedLevelId(level.id)}
                  className="level-card glass"
                >
                  <div className="level-preview">
                    {level.previewUrl ? (
                      <img src={level.previewUrl} alt={level.level_name} loading="lazy" />
                    ) : (
                      <div className="no-preview">
                        <ImageIcon size={48} />
                      </div>
                    )}
                  </div>
                  <div className="level-overlay">
                    <span className="level-meta">{level.level_number}</span>
                    <h3 className="level-title">{level.level_name}</h3>
                    <div className="level-badges">
                      <span className="badge">
                        {level.count} Images
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => setSelectedLevelId(null)}
                className="back-button"
              >
                <ChevronLeft size={20} />
                Back to Levels
              </button>

              <div className="gallery-header">
                <span className="gallery-meta">{selectedLevel?.level_number}</span>
                <h2 className="gallery-title">{selectedLevel?.level_name}</h2>
              </div>

              <div className="submissions-grid">
                {filteredSubmissions.map((sub, idx) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="submission-card"
                  >
                    <div className="image-wrapper">
                      <img
                        src={sub.storage_path ? supabase.storage.from('level-images').getPublicUrl(sub.storage_path).data.publicUrl : sub.image_url}
                        alt={`Submission by ${sub.discord_name}`}
                      />
                    </div>
                    <div className="submission-content">
                      <div className="author-info">
                        <img src={sub.discord_avatar_url} className="author-avatar" alt={sub.discord_name} />
                        <div className="author-details">
                          <p className="author-name">{sub.discord_name}</p>
                          <p className="submission-date">
                            <Clock size={10} /> {new Date(sub.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="likes-badge">
                        <ThumbsUp size={14} />
                        <span>{sub.thumbs_up}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
