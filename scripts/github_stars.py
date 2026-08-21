#!/usr/bin/env python3
"""
GitHub Stars Fetcher - 获取 GitHub 用户 Star 的项目并保存为 JSON

Usage:
    python scripts/github_stars.py <username> [output_file]

Environment Variables:
    GITHUB_TOKEN - GitHub Personal Access Token (可选，提高 API 速率限制)

Examples:
    python scripts/github_stars.py dllen
    python scripts/github_stars.py dllen src/data/github-stars.json
    GITHUB_TOKEN=ghp_xxx python scripts/github_stars.py dllen
"""

import json
import sys
import os
import time
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional

GITHUB_API = "https://api.github.com"
DEFAULT_OUTPUT = "src/data/github-stars.json"


def get_headers() -> Dict[str, str]:
    """获取 GitHub API 请求头"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Stars-Fetcher"
    }
    # 优先使用命令行参数，其次使用环境变量
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"
        print("✓ Using GITHUB_TOKEN from environment")
    return headers


def check_rate_limit() -> Dict[str, Any]:
    """检查 API 速率限制状态"""
    try:
        response = requests.get(f"{GITHUB_API}/rate_limit", headers=get_headers(), timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get('rate', {})
    except Exception as e:
        return {"remaining": 0, "error": str(e)}


def fetch_user_stars(username: str, max_stars: int = 500) -> List[Dict[str, Any]]:
    """
    获取用户的 GitHub Stars

    Args:
        username: GitHub 用户名
        max_stars: 最大获取数量

    Returns:
        项目列表
    """
    stars = []
    page = 1
    per_page = 100

    print(f"Fetching stars for user: {username}")

    # 检查速率限制
    rate_limit = check_rate_limit()
    if rate_limit.get("remaining", 1) == 0:
        reset_time = rate_limit.get("reset", 0)
        if reset_time:
            from datetime import datetime, timezone
            reset_dt = datetime.fromtimestamp(reset_time, tz=timezone.utc)
            wait_seconds = (reset_dt - datetime.now(timezone.utc)).total_seconds()
            print(f"⚠ Rate limited! Resets at {reset_dt.strftime('%Y-%m-%d %H:%M:%S UTC')}")
            print(f"  Wait approximately {int(wait_seconds / 60)} minutes, or set GITHUB_TOKEN")
            print(f"  Or use: gh auth token | python scripts/github_stars.py {username}")
            return []
        else:
            print("⚠ Rate limited! Set GITHUB_TOKEN for higher limits")
            print("  Get a token at: https://github.com/settings/tokens")
            print("  Required scopes: None (public repos only)")
            print("  Usage: export GITHUB_TOKEN=ghp_xxx && python scripts/github_stars.py", username)
            return []

    while len(stars) < max_stars:
        url = f"{GITHUB_API}/users/{username}/starred"
        params = {
            "page": page,
            "per_page": min(per_page, max_stars - len(stars)),
            "sort": "updated"  # 按更新时间排序
        }

        try:
            response = requests.get(url, headers=get_headers(), params=params, timeout=30)

            # 检查速率限制响应头
            remaining = int(response.headers.get('X-RateLimit-Remaining', 1))
            if remaining == 0:
                print("⚠ API rate limit reached during fetching")
                break

            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                print(f"❌ User '{username}' not found on GitHub")
            elif e.response.status_code == 403:
                print(f"⚠ Rate limited (HTTP 403). Remaining: {remaining}")
            else:
                print(f"Error fetching stars: {e}")
            break
        except requests.exceptions.RequestException as e:
            print(f"Error fetching stars: {e}")
            break

        data = response.json()

        if not data:
            break

        for repo in data:
            stars.append({
                "name": repo.get("name", ""),
                "full_name": repo.get("full_name", ""),
                "description": repo.get("description") or "",
                "url": repo.get("html_url", ""),
                "stars": repo.get("stargazers_count", 0),
                "forks": repo.get("forks_count", 0),
                "language": repo.get("language") or "Unknown",
                "topics": repo.get("topics", [])[:5],  # 限制话题数量
                "updated_at": repo.get("updated_at", ""),
                "owner_avatar": repo.get("owner", {}).get("avatar_url", ""),
                "license": repo.get("license", {}).get("name", "") if repo.get("license") else ""
            })

        print(f"Fetched {len(stars)} stars...")

        # 检查是否还有更多页面
        if len(data) < per_page:
            break

        page += 1

        # 避免请求过快
        if len(stars) < max_stars:
            time.sleep(0.5)

    return stars


def categorize_by_language(stars: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """按编程语言对项目进行分类"""
    categorized = {}
    for star in stars:
        lang = star.get("language", "Unknown")
        if lang not in categorized:
            categorized[lang] = []
        categorized[lang].append(star)

    # 按项目数量排序
    return dict(sorted(categorized.items(), key=lambda x: len(x[1]), reverse=True))


def categorize_by_topic(stars: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """按话题标签对项目进行分类"""
    categorized = {}
    for star in stars:
        topics = star.get("topics", [])
        if not topics:
            topics = ["untagged"]

        for topic in topics:
            if topic not in categorized:
                categorized[topic] = []
            categorized[topic].append(star)

    # 按项目数量排序
    return dict(sorted(categorized.items(), key=lambda x: len(x[1]), reverse=True))


def main():
    if len(sys.argv) < 2:
        print("Usage: python github_stars.py <username> [output_file]")
        print(f"Default output: {DEFAULT_OUTPUT}")
        print()
        print("Environment Variables:")
        print("  GITHUB_TOKEN - Optional. Get one at https://github.com/settings/tokens")
        sys.exit(1)

    username = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUTPUT

    # 确保输出目录存在
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    # 获取 Stars
    stars = fetch_user_stars(username)

    if not stars:
        print("\n❌ No stars fetched. Possible reasons:")
        print("   1. GitHub API rate limit exceeded (without token)")
        print("   2. User not found")
        print("   3. Network error")
        print()
        print("💡 Solutions:")
        print("   1. Set GITHUB_TOKEN: export GITHUB_TOKEN=ghp_xxx")
        print("   2. Wait for rate limit reset (~1 hour)")
        print("   3. Or use GitHub CLI: gh auth login && gh api ... ")
        sys.exit(1)

    # 构建输出数据
    output_data = {
        "username": username,
        "fetched_at": datetime.now().isoformat(),
        "total_count": len(stars),
        "stars": stars,
        "by_language": categorize_by_language(stars),
        "by_topic": categorize_by_topic(stars)
    }

    # 保存为 JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Successfully fetched {len(stars)} starred repositories")
    print(f"📁 Saved to: {output_file}")

    # 打印语言统计
    print("\n📊 Language distribution:")
    for lang, repos in list(output_data["by_language"].items())[:10]:
        print(f"  {lang}: {len(repos)} repos")


if __name__ == "__main__":
    main()
