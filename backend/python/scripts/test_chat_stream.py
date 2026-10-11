"""
scripts/test_chat_stream.py
───────────────────────────
Standalone interactive test script for POST /chat.
"""
import asyncio
import httpx


async def main() -> None:
    token = "<YOUR_FIREBASE_TOKEN>"
    url = "http://localhost:8000/chat"
    payload = {"message": "What is the eligibility criteria and exam pattern for JEE Advanced?"}
    headers = {"Authorization": f"Bearer {token}"}

    print(f"Connecting to {url}...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            async with client.stream("POST", url, json=payload, headers=headers) as response:
                print(f"Response status: {response.status_code}")
                async for line in response.aiter_lines():
                    if line:
                        print(line)
        except Exception as exc:
            print("Error connecting to server:", exc)


if __name__ == "__main__":
    asyncio.run(main())
