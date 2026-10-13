---
title: Blob Storage
track: sysdesign
tags: [storage, cdn, durability, distributed]
difficulty: 2
minutes: 5
tldr: "Store big files as objects (key → bytes + metadata) in a bucket, keep only the key in your database, let clients upload and download directly with pre-signed URLs, and put a CDN in front."
analogy: "A cloakroom: you hand over a coat and get a ticket number. The cloakroom does not care what is in the pockets, only the ticket. Your database keeps the ticket, never the coat."
diagram: blob-storage
story:
  - title: A bucket of objects
    text: "Object storage (S3, Google Cloud Storage, Azure Blob) keeps files as objects in a bucket. Each object is a key like users/42/cat.jpg, the bytes, and metadata such as the content type. The namespace is flat: the slashes are just characters in the key, not real folders."
  - title: The app hands out a pre-signed URL
    text: "A 2 MB photo or a 1 GB video should not stream through your app servers or sit in database rows. The client asks the app for permission; the app checks who it is and returns a pre-signed URL: a link that allows one PUT to one key, signed with the app's secret, valid for 15 minutes."
  - title: Upload directly, in parallel parts
    text: "The client sends the bytes straight to the bucket. A big file goes as a multipart upload: parts are sent in parallel, a failed part is retried alone, and a final 'complete' call stitches them into one object. The app server never touches the bytes; it stores only the key."
  - title: "Erasure coding: 6 data + 3 parity"
    text: "To survive dead disks, the store splits the object into 6 data chunks and computes 3 parity chunks, then puts the 9 chunks on 9 different disks. That costs 9/6 = 1.5× the raw size, against 3× for keeping three full copies."
  - title: Lose any 3 disks, still readable
    text: "Any 6 of the 9 chunks are enough to rebuild the object, so three disks can fail at once and nothing is lost. Three full copies survive only two failures yet cost twice as much space. The price is CPU and network to rebuild."
  - title: A CDN serves the reads
    text: "Popular objects are read far more often than written. A CDN edge near the viewer caches them; on a miss it fetches once from the bucket, its origin. Viewers get the bytes in tens of milliseconds and the bucket sees a small fraction of the traffic."
keyIdeas:
  - "**Object = key + bytes + metadata** in a flat bucket. Objects are written whole and read by key or byte range; there are no in-place edits."
  - "Keep **bytes in the blob store and the key in the database**: rows stay small, backups stay fast and storage is several times cheaper."
  - "**Pre-signed URLs** let clients upload and download directly, so app servers never proxy large files. **Multipart upload** gives parallelism and per-part retries."
  - "**Erasure coding** (k data + m parity) survives m lost chunks for (k+m)/k overhead: 6+3 is 1.5× and survives 3 failures; 3× replication survives 2."
  - "**Storage classes** and **lifecycle rules** move cold objects to cheaper tiers; a **CDN** in front serves hot reads near users."
quiz:
  - q: "Users upload 500 MB videos. What is the best upload path?"
    options: ["POST the file to the app server, which writes it into a BLOB column", "POST to the app server, which forwards it to object storage", "The app returns a pre-signed URL and the client does a multipart upload straight to object storage", "Email the file to the operations team"]
    answer: 2
    why: "The app only authorises and records the key. The bytes go directly to object storage in parallel parts, so app servers and the database never carry 500 MB per request, and a failed part is retried alone."
  - q: "An object is erasure-coded 6+3. How much raw storage does a 1.2 GB object use, and how many lost chunks can it survive?"
    options: ["3.6 GB, survives 2", "1.8 GB, survives 3", "1.2 GB, survives 0", "1.8 GB, survives 6"]
    answer: 1
    why: "Each chunk is 1.2 / 6 = 0.2 GB and there are 9 of them: 1.8 GB, i.e. 1.5×. Any 6 chunks rebuild the object, so up to 3 can be lost."
  - q: "You rename the 'folder' photos/ to images/ in an S3-style bucket holding 2 million objects under that prefix. What actually happens?"
    options: ["One metadata update", "2 million copy operations plus 2 million deletes, because folders are only key prefixes", "Nothing; renames are not allowed but are free", "The bucket is locked until the rename finishes"]
    answer: 1
    why: "The namespace is flat. photos/a.jpg is one key; there is no folder object to rename. Each key must be copied to a new name and the old one deleted."
bigO:
  - { op: "max object size (S3)", avg: "5 TB", note: "single PUT up to 5 GB; larger needs multipart" }
  - { op: "multipart parts", avg: "5 MiB – 5 GiB each", note: "up to 10,000 parts; the last part may be smaller" }
  - { op: "3× replication", avg: "3.0× storage", note: "survives 2 lost copies" }
  - { op: "6+3 erasure coding", avg: "1.5× storage", note: "survives any 3 lost chunks" }
  - { op: "designed durability (S3)", avg: "99.999999999 %", note: "eleven nines per year" }
bigOTitle: "Key numbers"
related: [sysdesign/dns-and-cdns, sysdesign/replication, sysdesign/sql-vs-nosql, sysdesign/back-of-envelope]
prereqs: [sysdesign/client-server-basics]
flashcards:
  - kind: qa
    q: "What is a pre-signed URL and why use one?"
    a: "A URL for one operation (e.g. PUT users/42/cat.jpg) signed with the server's secret and an expiry. The client uploads or downloads directly against the blob store, so large files never pass through app servers."
  - kind: cloze
    text: "Erasure coding with 6 data and 3 parity chunks stores {{1.5×}} the data and survives any {{3}} lost chunks."
  - kind: qa
    q: "Why not store images in the relational database?"
    a: "Large values bloat rows, the buffer cache, backups and replication, and database storage is far more expensive per GB. Store the bytes in object storage and only the key and metadata in the row."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Object store and CDN sections, background" }
---

## The object model

**Blob** stands for *binary large object*: a photo, a video, a PDF, a backup, a log archive. **Object storage** (Amazon S3, Google Cloud Storage, Azure Blob Storage, or self-hosted MinIO and Ceph) stores blobs with a deliberately small API:

- A **bucket** is a named container, often one per application or per environment.
- An **object** is a **key** (a string such as `users/42/cat.jpg`), the **bytes**, and **metadata**: content type, size, an ETag (a checksum-like version tag), and any custom headers you attach.
- The operations are `PUT` (write a whole object), `GET` (read it, optionally a **byte range**), `DELETE`, `HEAD` (metadata only) and `LIST` by key prefix.

Two properties shape every design that uses it:

1. **The namespace is flat.** `users/42/cat.jpg` is a single key; the `/` is an ordinary character. Consoles show folders by grouping keys on a prefix and delimiter, but "renaming a folder" means copying and deleting every object under the prefix.
2. **Objects are immutable units.** You replace an object whole; you cannot append to it or rewrite bytes 100 to 200 in place. That is what lets the store spread, copy and cache objects so freely.

In return you get practically unlimited capacity, very high durability, and a price per GB well below a database's provisioned SSD.

## Why not just put files in the database

A relational database *can* hold a `BLOB` column, but large values hurt everything around them. Rows become megabytes, so they push useful pages out of the buffer cache. Backups, restores and replica rebuilds have to copy every file. Replication streams the bytes to every follower. Each upload ties up a database connection for seconds. And you pay database prices for data that is never queried.

The standard split: **bytes in the blob store, a small row in the database** with the key, size, content type, owner and status. The database answers "which photos does user 42 have?"; the blob store answers "give me the bytes of `users/42/cat.jpg`".

## How it works: the upload path

1. The client asks the app: "I want to upload `cat.jpg`, 2 MB, `image/jpeg`."
2. The app authenticates the user, decides the key (use a generated, unguessable key such as `users/42/9f3c…jpg`, never the raw filename), writes a row with `status = pending`, and creates a **pre-signed URL**. That is an ordinary URL to the bucket plus a signature computed with the app's secret credentials over the method, bucket, key, expiry and selected headers. Nothing is sent to the blob store at this point; the signature is computed locally.
3. The client sends `PUT` straight to that URL. The blob store recomputes the signature and checks the expiry. It accepts exactly that operation on exactly that key and nothing else.
4. The store emits an **event notification** (or the client calls the app) and the app marks the row `ready`, perhaps queueing a job to make thumbnails.

Downloads mirror this: the app returns a pre-signed `GET` URL, or for public content a CDN URL.

### Multipart upload

A 1 GB video over a phone connection should not be one 1 GB request that restarts from zero when the train enters a tunnel. **Multipart upload**: *initiate* (the store returns an upload ID), upload numbered *parts* in parallel (each part returns an ETag), then *complete* with the list of part numbers and ETags, and the store assembles one object. In S3, parts are 5 MiB to 5 GiB, at most 10,000 parts, and an object can reach 5 TB; a single `PUT` is limited to 5 GB.

## Durability: replication vs erasure coding

Disks fail all the time at scale, so every object is stored redundantly across disks, servers and usually several data centres.

- **Replication** keeps three full copies: 3× the storage, survives the loss of 2.
- **Erasure coding** (usually Reed-Solomon) splits the object into **k** data chunks and computes **m** parity chunks such that **any k of the k + m** rebuild the original. Overhead is (k + m) / k.

### Worked example: a 1 GB video, 6+3

| | 3× replication | Erasure coding 6+3 |
|---|---|---|
| What is stored | 3 copies of 1 GB | 6 data chunks of ≈ 167 MB + 3 parity chunks of ≈ 167 MB |
| Raw bytes | 3 GB | 9 × 167 MB = 1.5 GB |
| Lost pieces it survives | 2 | any 3 |
| Reading normally | read one copy | read the 6 data chunks and join them |
| After a failure | read another copy | read any 6 chunks and decode, costing CPU and network |

For 1 PB of user data that is 3 PB of disk against 1.5 PB: half the hardware with *better* fault tolerance. The cost is rebuild work, and higher latency for small objects, since each read touches 6 machines. So systems often replicate small or freshly written data and erasure-code large, colder data. Chunks are placed across failure domains (different racks or availability zones) so that one rack fire cannot remove more than m of them. This is how S3 can be *designed* for 99.999999999 % (eleven nines) annual durability.

## Storage classes and lifecycle

Most objects are hot for days and cold forever after. Providers sell **storage classes** that trade storage price for access price and speed: standard (instant, about $23 per TB-month on S3), infrequent access (cheaper to store, a fee per GB read, a 30-day minimum), and archive tiers (around $1 per TB-month for S3 Glacier Deep Archive, but retrieval takes hours). **Lifecycle rules** move or delete objects automatically by age or prefix.

## In code

The app hands out a pre-signed PUT, and a lifecycle rule tidies up:

```python
import boto3, uuid
s3 = boto3.client("s3")

def start_upload(user_id: int, content_type: str) -> dict:
    key = f"users/{user_id}/{uuid.uuid4()}.jpg"          # unguessable, never the raw filename
    db.insert("photos", key=key, owner=user_id, status="pending")
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": "photos", "Key": key, "ContentType": content_type},
        ExpiresIn=900)                                    # 15 minutes
    return {"key": key, "upload_url": url}                # client PUTs the bytes here
```

```json
{ "Rules": [{ "ID": "age-out", "Status": "Enabled", "Filter": { "Prefix": "users/" },
    "Transitions": [{ "Days": 30, "StorageClass": "STANDARD_IA" },
                    { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }],
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 } }] }
```

## A CDN in front

Reads of popular objects go through a **CDN**: edge servers near users cache the object, and on a miss fetch it once from the bucket, which is called the **origin**. Make keys **content-addressed or versioned** (`cat.v2.jpg`, or a hash in the name) so you can cache with a long `Cache-Control: max-age` and never need to purge. Keep the bucket private and let only the CDN read it; for private content use signed CDN URLs or cookies.

## Edge cases and pitfalls

- **Abandoned multipart uploads** keep their parts, and you are billed for them, until aborted. Add a lifecycle rule to abort them.
- **Orphans in both directions:** a row whose upload never finished, or an object whose row was deleted. Use the `pending` status, event notifications, and a periodic sweep.
- **Pre-signed PUT URLs do not limit size by themselves.** Sign the content length, or use a pre-signed POST policy with a size range, and validate the file type after upload.
- **Hot prefixes and listing:** `LIST` is paginated (1,000 keys per page on S3) and slow over millions of keys. Keep your own index in the database instead of listing to find things.
- **Public buckets** are a classic data leak. Default to private plus signed URLs.

## In the interview

Any design with photos, videos or files (Instagram, YouTube, Dropbox) needs this. A strong answer says: metadata in the database, bytes in object storage, uploads and downloads via pre-signed URLs, multipart for large files, a processing queue triggered on upload, a CDN for reads, and lifecycle tiers for cost. Expect follow-ups such as *"how is the data not lost?"* (replication or erasure coding across zones, with the 1.5× vs 3× arithmetic) and *"how do you stop someone uploading 50 GB through your URL?"* (sign the size, short expiry, per-user quotas).
