"""
Demo session service for managing isolated temporary demo accounts.

Each demo session gets:
- Unique session ID
- Isolated data (cars, fuel, insurances, inspections)
- Auto-cleanup on logout or after 2 hours
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any

from django.core.cache import cache
from django.conf import settings


class DemoSessionService:
    """Service for managing temporary isolated demo sessions."""
    
    # Template data that will be copied for each new demo session
    TEMPLATE_DATA = {
        'cars': [
            {
                'id': 1,
                'numplate': 'А001АА',
                'brand': 'Toyota',
                'title': 'Camry',
                'vin': 'DEMO1234567890001',
                'driver': 'Demo Driver 1',
                'status': 'ACTIVE'
            },
            {
                'id': 2,
                'numplate': 'Б002ББ',
                'brand': 'BMW',
                'title': 'X5',
                'vin': 'DEMO1234567890002',
                'driver': 'Demo Driver 2',
                'status': 'ACTIVE'
            },
            {
                'id': 3,
                'numplate': 'В003ВВ',
                'brand': 'Mercedes',
                'title': 'E-Class',
                'vin': 'DEMO1234567890003',
                'driver': 'Demo Driver 3',
                'status': 'ACTIVE'
            }
        ],
        'fuel': [
            # Car 1 - 3 months
            {'id': 1, 'car_id': 1, 'year': 2026, 'month': 1, 'liters': 45.5, 'total_cost': 3640, 'monthly_mileage': 520},
            {'id': 2, 'car_id': 1, 'year': 2025, 'month': 12, 'liters': 48.2, 'total_cost': 3856, 'monthly_mileage': 550},
            {'id': 3, 'car_id': 1, 'year': 2025, 'month': 11, 'liters': 42.0, 'total_cost': 3360, 'monthly_mileage': 480},
            # Car 2 - 3 months
            {'id': 4, 'car_id': 2, 'year': 2026, 'month': 1, 'liters': 55.0, 'total_cost': 4400, 'monthly_mileage': 480},
            {'id': 5, 'car_id': 2, 'year': 2025, 'month': 12, 'liters': 58.5, 'total_cost': 4680, 'monthly_mileage': 510},
            {'id': 6, 'car_id': 2, 'year': 2025, 'month': 11, 'liters': 52.0, 'total_cost': 4160, 'monthly_mileage': 450},
            # Car 3 - 3 months
            {'id': 7, 'car_id': 3, 'year': 2026, 'month': 1, 'liters': 50.0, 'total_cost': 4000, 'monthly_mileage': 500},
            {'id': 8, 'car_id': 3, 'year': 2025, 'month': 12, 'liters': 53.5, 'total_cost': 4280, 'monthly_mileage': 530},
            {'id': 9, 'car_id': 3, 'year': 2025, 'month': 11, 'liters': 47.0, 'total_cost': 3760, 'monthly_mileage': 470},
        ],
        'insurances': [
            {
                'id': 1,
                'car_id': 1,
                'insurance_type': 'OSAGO',
                'number': 'DEMO-А001АА-OSAGO',
                'start_date': '2025-06-01',
                'end_date': '2026-05-31',
                'cost': 5000
            },
            {
                'id': 2,
                'car_id': 2,
                'insurance_type': 'OSAGO',
                'number': 'DEMO-Б002ББ-OSAGO',
                'start_date': '2025-06-01',
                'end_date': '2026-05-31',
                'cost': 6500
            },
            {
                'id': 3,
                'car_id': 3,
                'insurance_type': 'OSAGO',
                'number': 'DEMO-В003ВВ-OSAGO',
                'start_date': '2025-06-01',
                'end_date': '2026-05-31',
                'cost': 7000
            }
        ],
        'inspections': [
            {
                'id': 1,
                'car_id': 1,
                'number': 'DEMO-А001АА-INSP',
                'inspected_at': '2025-08-15',
                'cost': 3000
            },
            {
                'id': 2,
                'car_id': 2,
                'number': 'DEMO-Б002ББ-INSP',
                'inspected_at': '2025-08-20',
                'cost': 3000
            },
            {
                'id': 3,
                'car_id': 3,
                'number': 'DEMO-В003ВВ-INSP',
                'inspected_at': '2025-08-25',
                'cost': 3000
            }
        ]
    }
    
    @staticmethod
    def create_session() -> Dict[str, Any]:
        """
        Create a new demo session with isolated data.
        
        Returns:
            dict: Session data including session_id, user_id, company_id, etc.
        """
        # Check session limit
        active_count = cache.get('demo:session_count', 0)
        if active_count >= settings.DEMO_SESSION_LIMIT:
            DemoSessionService._cleanup_oldest()
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        short_id = session_id[:8]
        
        session_data = {
            'session_id': session_id,
            'user_id': f'demo-{short_id}',
            'company_id': f'Demo-{short_id}',
            'username': f'demo-{short_id}',
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(seconds=settings.DEMO_SESSION_TTL)).isoformat()
        }
        
        # Save session metadata
        cache.set(
            f'demo:sessions:{session_id}',
            json.dumps(session_data),
            timeout=settings.DEMO_SESSION_TTL
        )
        
        # Copy template data for this session
        for resource_type, data in DemoSessionService.TEMPLATE_DATA.items():
            cache.set(
                f'demo:data:{session_id}:{resource_type}',
                json.dumps(data),
                timeout=settings.DEMO_SESSION_TTL
            )
        
        # Track active sessions (sorted set by timestamp)
        active_sessions = cache.get('demo:active_sessions', {})
        active_sessions[session_id] = datetime.now().timestamp()
        cache.set('demo:active_sessions', active_sessions, timeout=None)
        
        # Increment session count
        cache.set('demo:session_count', active_count + 1, timeout=None)
        
        return session_data
    
    @staticmethod
    def get_session(session_id: str) -> Optional[Dict[str, Any]]:
        """Get session metadata by session_id."""
        data = cache.get(f'demo:sessions:{session_id}')
        return json.loads(data) if data else None
    
    @staticmethod
    def get_data(session_id: str, resource_type: str, page: int = 1, page_size: int = 20) -> List[Dict]:
        """
        Get data for a specific resource type from demo session.
        
        Args:
            session_id: Demo session ID
            resource_type: 'cars', 'fuel', 'insurances', or 'inspections'
            page: Page number for pagination
            page_size: Items per page
            
        Returns:
            list: Resource data
        """
        key = f'demo:data:{session_id}:{resource_type}'
        data = cache.get(key)
        
        if not data:
            return []
        
        all_data = json.loads(data)
        
        # Simple pagination
        start = (page - 1) * page_size
        end = start + page_size
        return all_data[start:end]
    
    @staticmethod
    def get_all_data(session_id: str, resource_type: str) -> List[Dict]:
        """Get all data for a resource type without pagination."""
        key = f'demo:data:{session_id}:{resource_type}'
        data = cache.get(key)
        return json.loads(data) if data else []
    
    @staticmethod
    def create_item(session_id: str, resource_type: str, item_data: Dict) -> Dict:
        """
        Add a new item to demo session data.
        
        Args:
            session_id: Demo session ID
            resource_type: 'cars', 'fuel', 'insurances', or 'inspections'
            item_data: New item data
            
        Returns:
            dict: Created item with ID
        """
        all_data = DemoSessionService.get_all_data(session_id, resource_type)
        
        # Generate new ID
        max_id = max([item.get('id', 0) for item in all_data], default=0)
        new_item = {'id': max_id + 1, **item_data}
        
        # Add to data
        all_data.append(new_item)
        
        # Save back
        DemoSessionService._save_data(session_id, resource_type, all_data)
        
        return new_item
    
    @staticmethod
    def update_item(session_id: str, resource_type: str, item_id: int, item_data: Dict) -> Optional[Dict]:
        """Update an existing item in demo session data."""
        all_data = DemoSessionService.get_all_data(session_id, resource_type)
        
        for i, item in enumerate(all_data):
            if item.get('id') == item_id:
                all_data[i] = {'id': item_id, **item_data}
                DemoSessionService._save_data(session_id, resource_type, all_data)
                return all_data[i]
        
        return None
    
    @staticmethod
    def delete_item(session_id: str, resource_type: str, item_id: int) -> bool:
        """Delete an item from demo session data."""
        all_data = DemoSessionService.get_all_data(session_id, resource_type)
        
        filtered_data = [item for item in all_data if item.get('id') != item_id]
        
        if len(filtered_data) < len(all_data):
            DemoSessionService._save_data(session_id, resource_type, filtered_data)
            return True
        
        return False
    
    @staticmethod
    def _save_data(session_id: str, resource_type: str, data: List[Dict]):
        """Save data back to cache with refreshed TTL."""
        key = f'demo:data:{session_id}:{resource_type}'
        cache.set(key, json.dumps(data), timeout=settings.DEMO_SESSION_TTL)
    
    @staticmethod
    def cleanup_session(session_id: str):
        """
        Clean up all data for a demo session.
        Called on logout or tab close.
        """
        # Delete session metadata
        cache.delete(f'demo:sessions:{session_id}')
        
        # Delete all resource data
        for resource_type in ['cars', 'fuel', 'insurances', 'inspections']:
            cache.delete(f'demo:data:{session_id}:{resource_type}')
        
        # Remove from active sessions
        active_sessions = cache.get('demo:active_sessions', {})
        if session_id in active_sessions:
            del active_sessions[session_id]
            cache.set('demo:active_sessions', active_sessions, timeout=None)
        
        # Decrement session count
        current_count = cache.get('demo:session_count', 0)
        cache.set('demo:session_count', max(0, current_count - 1), timeout=None)
    
    @staticmethod
    def _cleanup_oldest():
        """Remove oldest session when limit is reached."""
        active_sessions = cache.get('demo:active_sessions', {})
        
        if not active_sessions:
            return
        
        # Find oldest session
        oldest_session_id = min(active_sessions.items(), key=lambda x: x[1])[0]
        DemoSessionService.cleanup_session(oldest_session_id)
    
    @staticmethod
    def cleanup_expired_sessions():
        """
        Cleanup all expired sessions.
        Should be called by a management command periodically.
        """
        active_sessions = cache.get('demo:active_sessions', {})
        now = datetime.now().timestamp()
        
        expired = []
        for session_id, created_at in active_sessions.items():
            if now - created_at > settings.DEMO_SESSION_TTL:
                expired.append(session_id)
        
        for session_id in expired:
            DemoSessionService.cleanup_session(session_id)
        
        return len(expired)
