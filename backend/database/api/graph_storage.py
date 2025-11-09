"""
Graph Storage Module for Piggy Graph
Saves and retrieves graph data (nodes, edges, insights) to/from Snowflake
Used for recommendations and historical analysis
"""

from datetime import datetime
import json
from .db import get_conn

def save_graph_to_db(user_id: str, nodes: list, edges: list, insights: dict, stats: dict):
    """
    Save graph data to Snowflake for later use in recommendations
    
    Args:
        user_id: User identifier
        nodes: List of graph nodes
        edges: List of graph edges
        insights: Categorized insights (location, frequency, preferences)
        stats: Statistics about spending patterns
    """
    with get_conn() as conn:
        cursor = conn.cursor()
        
        try:
            # Create table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.USER_GRAPH_DATA (
                    USER_ID VARCHAR(255),
                    GENERATED_AT TIMESTAMP_NTZ,
                    NODES VARIANT,
                    EDGES VARIANT,
                    LOCATION_INSIGHTS VARIANT,
                    FREQUENCY_INSIGHTS VARIANT,
                    PREFERENCE_INSIGHTS VARIANT,
                    STATS VARIANT,
                    PRIMARY KEY (USER_ID, GENERATED_AT)
                )
            """)
            
            # Insert graph data
            cursor.execute("""
                INSERT INTO SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.USER_GRAPH_DATA
                (USER_ID, GENERATED_AT, NODES, EDGES, LOCATION_INSIGHTS, FREQUENCY_INSIGHTS, PREFERENCE_INSIGHTS, STATS)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                datetime.now(),
                json.dumps(nodes),
                json.dumps(edges),
                json.dumps(insights.get('location', [])),
                json.dumps(insights.get('frequency', [])),
                json.dumps(insights.get('preferences', [])),
                json.dumps(stats)
            ))
            
            conn.commit()
            print(f"✅ Saved graph data for user {user_id}")
            
        except Exception as e:
            print(f"❌ Error saving graph data: {e}")
            conn.rollback()
        finally:
            cursor.close()


def get_latest_graph_from_db(user_id: str):
    """
    Retrieve the most recent graph data for a user
    
    Args:
        user_id: User identifier
        
    Returns:
        dict with nodes, edges, insights, stats, and timestamp
    """
    with get_conn() as conn:
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT 
                    GENERATED_AT,
                    NODES,
                    EDGES,
                    LOCATION_INSIGHTS,
                    FREQUENCY_INSIGHTS,
                    PREFERENCE_INSIGHTS,
                    STATS
                FROM SNOWFLAKE_LEARNING_DB.BALANCEIQ_CORE.USER_GRAPH_DATA
                WHERE USER_ID = %s
                ORDER BY GENERATED_AT DESC
                LIMIT 1
            """, (user_id,))
            
            row = cursor.fetchone()
            
            if row:
                return {
                    'generated_at': row[0],
                    'nodes': json.loads(row[1]) if isinstance(row[1], str) else row[1],
                    'edges': json.loads(row[2]) if isinstance(row[2], str) else row[2],
                    'insights': {
                        'location': json.loads(row[3]) if isinstance(row[3], str) else row[3],
                        'frequency': json.loads(row[4]) if isinstance(row[4], str) else row[4],
                        'preferences': json.loads(row[5]) if isinstance(row[5], str) else row[5],
                    },
                    'stats': json.loads(row[6]) if isinstance(row[6], str) else row[6],
                }
            
            return None
            
        except Exception as e:
            print(f"❌ Error retrieving graph data: {e}")
            return None
        finally:
            cursor.close()


def get_user_preferences_for_recommendations(user_id: str):
    """
    Extract user preferences from latest graph data for making recommendations
    
    Args:
        user_id: User identifier
        
    Returns:
        dict with top categories, frequent merchants, spending patterns
    """
    graph_data = get_latest_graph_from_db(user_id)
    
    if not graph_data:
        return None
    
    insights = graph_data.get('insights', {})
    stats = graph_data.get('stats', {})
    
    # Extract actionable data for recommendations
    preferences = {
        'top_categories': [],
        'frequent_locations': [],
        'spending_frequency': [],
        'preferences': []
    }
    
    # Parse location insights for frequent merchants
    for insight in insights.get('location', []):
        title = insight.get('title', '')
        if title:
            preferences['frequent_locations'].append(title)
    
    # Parse frequency insights
    for insight in insights.get('frequency', []):
        title = insight.get('title', '')
        if title:
            preferences['spending_frequency'].append(title)
    
    # Parse preference insights for categories
    for insight in insights.get('preferences', []):
        title = insight.get('title', '')
        if title:
            preferences['preferences'].append(title)
    
    # Add stats
    preferences['stats'] = stats
    
    return preferences
