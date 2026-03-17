import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useQueryConfig() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const hotelId = searchParams.get('h');
    const roomNumber = searchParams.get('r');

    // Persist parameters if they exist in the URL
    if (hotelId) {
      localStorage.setItem('hotel_id', hotelId);
    }
    if (roomNumber) {
      localStorage.setItem('room_number', roomNumber);
    }
  }, [searchParams]);

  // Return from URL params if available, otherwise from localStorage
  return {
    hotelId: searchParams.get('h') || localStorage.getItem('hotel_id'),
    roomId: searchParams.get('r') || localStorage.getItem('room_number'),
  };
}
