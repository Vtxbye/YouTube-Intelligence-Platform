import json
from pathlib import Path


POSITIVE_WORDS = {
    "good", "great", "helpful", "informative", "love", "useful",
    "balanced", "amazing", "excellent", "clear", "positive"
}

NEGATIVE_WORDS = {
    "bad", "misleading", "fake", "wrong", "biased", "confusing",
    "negative", "hate", "untrustworthy", "poor", "risk"
}


def classify_sentiment(text: str) -> str:
    text_lower = text.lower()

    positive_score = sum(1 for word in POSITIVE_WORDS if word in text_lower)
    negative_score = sum(1 for word in NEGATIVE_WORDS if word in text_lower)

    if positive_score > negative_score:
        return "Positive"
    if negative_score > positive_score:
        return "Negative"
    return "Neutral"


def build_video_record(video_id: int, title: str, channel: str, timestamp: str, youtube_id: str,
                       transcript: str, comments: list[str]) -> dict:
    transcript_sentiment = classify_sentiment(transcript)

    positive_comments = []
    negative_comments = []
    neutral_comments = []

    for comment in comments:
        sentiment = classify_sentiment(comment)
        comment_obj = {
            "text": comment,
            "sentiment": sentiment
        }

        if sentiment == "Positive":
            positive_comments.append(comment_obj)
        elif sentiment == "Negative":
            negative_comments.append(comment_obj)
        else:
            neutral_comments.append(comment_obj)

    return {
        "id": video_id,
        "title": title,
        "channel": channel,
        "timestamp": timestamp,
        "youtubeId": youtube_id,
        "transcriptSentiment": transcript_sentiment,
        "positiveComments": positive_comments,
        "negativeComments": negative_comments,
        "neutralComments": neutral_comments
    }


def main() -> None:
    sample_videos = [
        {
            "id": 1,
            "title": "AI in Healthcare Trends",
            "channel": "Health Insights",
            "timestamp": "2 hours ago",
            "youtube_id": "dQw4w9WgXcQ",
            "transcript": (
                "This video gives a helpful and informative overview of how AI can improve "
                "patient care, diagnostics, and hospital workflows. It presents a balanced "
                "and useful perspective."
            ),
            "comments": [
                "Very informative breakdown",
                "This was helpful",
                "Loved the explanation",
                "Too optimistic in my opinion",
                "Missed some risk concerns",
            ],
        },
        {
            "id": 2,
            "title": "Vaccine Debate on Social Media",
            "channel": "Medical Watch",
            "timestamp": "5 hours ago",
            "youtube_id": "M7lc1UVf-VE",
            "transcript": (
                "The video includes some misleading claims and confusing arguments. "
                "Several statements seem biased and risk spreading wrong information."
            ),
            "comments": [
                "This seems misleading",
                "Needs fact checking",
                "I do not trust this source",
                "Interesting perspective",
                "Good discussion overall",
            ],
        },
    ]

    results = [
        build_video_record(
            video_id=video["id"],
            title=video["title"],
            channel=video["channel"],
            timestamp=video["timestamp"],
            youtube_id=video["youtube_id"],
            transcript=video["transcript"],
            comments=video["comments"],
        )
        for video in sample_videos
    ]

    output_path = Path("sentiment_results.json")
    output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")

    print(f"Saved sentiment results to: {output_path.resolve()}")


if __name__ == "__main__":
    main()