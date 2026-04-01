'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TopicPage() {
  const { slug } = useParams();
  
  // Converts slug back to readable name
  const topicName = (slug as string)
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{topicName}</h1>
        <p className="text-gray-600 mt-1">YouTube videos and resources about {topicName}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Video content will be displayed here</p>
      </div>
    </div>
  );
}


/*

  useEffect(() => {
    fetch(`/api/videos/${slug}`)
      .then(res => res.json())
      .then(data => setVideos(data));
  }, [slug]);

  reads the data to find videos under the catagory clicked
*/