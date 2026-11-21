import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bell,
  HelpCircle,
} from 'lucide-react';
import Container from '../components/ui/Container';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import NoticeCard from '../components/notices/NoticeCard';
import NoticeFilters from '../components/notices/NoticeFilters';
import NoticeDetails from '../components/notices/NoticeDetails';
import { NOTICES, NOTICES_METADATA } from '../data/demoNotices';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NoticesPage() {
  useDocumentTitle('Public Notices & Community Updates — GaunPulse');

  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Selected notice derived directly from URL search params
  const activeNoticeId = searchParams.get('notice') || searchParams.get('id');
  const selectedNotice = useMemo(() => {
    if (!activeNoticeId) return null;
    return NOTICES.find((n) => n.id === activeNoticeId) || null;
  }, [activeNoticeId]);

  // Handle modal close
  const handleCloseDetails = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('notice');
    newParams.delete('id');
    setSearchParams(newParams, { replace: true });
  };

  // Handle modal open
  const handleSelectNotice = (notice) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('notice', notice.id);
    setSearchParams(newParams);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
  };

  // Filtered notices
  const filteredNotices = useMemo(() => {
    return NOTICES.filter((notice) => {
      // Category filter
      if (categoryFilter !== 'all' && notice.category !== categoryFilter) {
        return false;
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = notice.title.toLowerCase().includes(query);
        const matchSummary = notice.summary.toLowerCase().includes(query);
        const matchContent = notice.content.toLowerCase().includes(query);
        const matchLocation = notice.locationLabel.toLowerCase().includes(query);
        const matchAsset = notice.relatedInfrastructureName.toLowerCase().includes(query);

        if (!matchTitle && !matchSummary && !matchContent && !matchLocation && !matchAsset) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, categoryFilter]);

  // Featured notice (e.g. Bridge Scour Advisory)
  const featuredNotice = useMemo(() => {
    return NOTICES.find((n) => n.isFeatured) || null;
  }, []);

  return (
    <Container className="py-8 sm:py-12">
      <div className="space-y-8">
        {/* 1. Public Educational Introduction */}
        <div className="bg-white/90 border border-[#42866A]/20 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="amber">{NOTICES_METADATA.disclaimer}</Badge>
            <Badge variant="neutral">Civic Broadcast Demo</Badge>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#173D32] tracking-tight">
              Notices & Community Updates
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#1B2923]/80 leading-relaxed font-normal">
              Explore sample infrastructure announcements, inspection updates, and community
              information from the GaunPulse demonstration village.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#42866A]/15 text-xs text-[#42866A] flex flex-wrap items-center gap-4">
            <span>
              📢 <strong>Public Information Role:</strong> In rural communities, accessible public bulletins keep families, school staff, and ambulance drivers updated on physical trail conditions and inspection advisories before travel begins.
            </span>
          </div>
        </div>

        {/* 2. Featured Advisory Banner (if not currently filtered) */}
        {!searchQuery && categoryFilter === 'all' && featuredNotice && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D45F53]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#173D32]">
                Active Priority Advisory
              </h2>
            </div>
            <NoticeCard
              notice={featuredNotice}
              onSelect={handleSelectNotice}
              isFeaturedView={true}
            />
          </div>
        )}

        {/* 3. Search and Category Filter Toolbar */}
        <NoticeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onResetFilters={handleResetFilters}
          totalCount={NOTICES.length}
          filteredCount={filteredNotices.length}
        />

        {/* 4. Notice Grid or Empty State */}
        {filteredNotices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {filteredNotices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onSelect={handleSelectNotice}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 px-4 border-dashed border-[#42866A]/30">
            <div className="w-12 h-12 rounded-full bg-[#DDEBE2] mx-auto flex items-center justify-center text-[#42866A] mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#173D32]">
              No demonstration notices match your criteria
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[#1B2923]/70 max-w-sm mx-auto">
              Try adjusting your search terms or clearing your selected category to see all available demonstration bulletins.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold bg-[#173D32] text-white rounded-lg hover:bg-[#122F26] transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </Card>
        )}

        {/* 5. Detail Inspector Modal */}
        {selectedNotice && (
          <NoticeDetails
            notice={selectedNotice}
            onClose={handleCloseDetails}
          />
        )}
      </div>
    </Container>
  );
}

export default NoticesPage;
