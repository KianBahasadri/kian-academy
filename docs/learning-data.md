# Learning data

[The published library](../data/library.json) holds two collections. Resources are material Kian learns from. Practice is Kian's own work, including writing, videos, and projects. Everything in the file is public, including practice drafts. For the release process, see [Publishing](publishing.md).

Use `version: 1` and keep both `resources` and `practice` as arrays. Give each entry a nonempty `id` and `title`. IDs must be unique within their collection and should remain stable across edits. Use ISO 8601 for `createdAt` and `updatedAt`. The validator requires parseable date strings.

## Adding resources with OpenCode Go

Run the importer with Python 3 on Linux or macOS, the repository's Node.js version, and the OpenCode v2 CLI. It uses your existing Go login to run DeepSeek V4.1 Flash with maximum reasoning effort. For first-time setup, run `opencode`, enter `/connect`, and select OpenCode Go. [Go setup](https://opencode.ai/docs/console/go/)

```sh
./add-resources "Thinking in Systems by Donella Meadows" "https://docs.python.org/3/tutorial/"
```

Give each resource its own argument, or run the command without arguments and paste one resource per line, finishing with Ctrl-D. You can also pipe in a list. Include an ISBN or publisher URL for a particular edition and any progress you want recorded on that line.

Go researches the items against the current catalog and proposes metadata and classifications. While it waits for Go, the importer prints the elapsed time every 15 seconds. The script reports duplicates and unresolved inputs, validates the complete catalog, and commits additions together in `data/library.json` on `main`. It runs the build and tests, then pushes `main` to `origin` for Pages deployment. Start with a clean catalog. Use `--dry-run` to preview the records. A preview or a batch with only skipped items creates no commit or push.

## Resources

```json
{
  "id": "my-resource",
  "title": "The title of a book or course",
  "creator": "Its author or creator",
  "format": "Book",
  "tier": 2,
  "subjects": ["Mathematics", "Physics"],
  "url": "https://example.com/book",
  "description": "",
  "notes": "",
  "status": "learning",
  "progress": 40,
  "createdAt": "2026-10-26T12:00:00Z",
  "updatedAt": "2026-10-26T12:00:00Z"
}
```

Choose a format from `YouTube playlist`, `Course`, `Book`, `Textbook`, `Article`, and `Other`. Supply at least one subject as a nonblank string. Keep subjects unique within the list.

`creator`, `url`, `description`, and `notes` can be empty strings. Use a full HTTP or HTTPS URL for a resource link. Follow the [catalog editing rules](../AGENTS.md#rules) for sourced descriptions and Kian's own notes.

### Tiers

`tier` is a required integer from 1 to 5. It describes the work's intended audience and assumed knowledge.

| Tier | Meaning |
| --- | --- |
| 1 | For a general reader, with no prior study or university background and a manageable scope for independent learning. |
| 2 | Builds on entry-level familiarity with the topic. |
| 3 | Assumes established foundations and broader relevant reading. |
| 4 | Assumes substantial knowledge of the subject and its methods. |
| 5 | Written for specialists in a narrow area, beyond general expertise in the wider discipline. |

### Readiness and progress

| Status | Site label | Allowed progress |
| --- | --- | --- |
| `prerequisites` | Prerequisites needed | 0 |
| `planned` | To learn | 0 |
| `learning` | In progress | Any integer from 0 to 99 |
| `completed` | Completed | 100 |

Use `prerequisites` while the foundations still need work and `planned` when the resource is ready to start. Record readiness from the resource's assumed knowledge, the catalog, and the available context. It is independent of the tier and of any recorded learning progress.

*The Great Psychotherapy Debate* and *Motivational Interviewing* are set aside for foundational study based on their scope and audience. [Routledge's publication record](https://www.routledge.com/the-great-psychotherapy-debate-the-evidence-for-what-makes-psychotherapy/wampold-imel/p/book/9780805857092) · [Guilford's audience guide](https://www.guilford.com/books/Motivational-Interviewing/Miller-Rollnick/9781462552795/audience)

### Publication records

A resource can include an edition-specific `publication` object.

```json
{
  "year": 2023,
  "publisher": "The Guilford Press",
  "edition": "4th",
  "binding": "Hardcover",
  "isbn": "9781462552795",
  "pages": 338,
  "sourceUrl": "https://www.guilford.com/books/Motivational-Interviewing/Miller-Rollnick/9781462552795"
}
```

Supply an integer `year` from 1 to 9999, a nonblank `publisher`, and an HTTP or HTTPS `sourceUrl` for the supporting publisher or catalog record. For books and textbooks, include a valid ISBN-13 with its checksum. The validator allows spaces and hyphens in ISBNs. Only books and textbooks can carry an ISBN.

`edition` and `binding` are optional nonblank strings. `pages` is an optional positive integer. The year, ISBN, binding, and page count refer to the edition described by the source.

## Practice

```json
{
  "id": "my-essay",
  "title": "An idea explained in my own words",
  "format": "Essay",
  "subject": "Mathematics",
  "resourceId": "my-resource",
  "url": "",
  "content": "My writing goes here.\n\nA second paragraph.",
  "status": "finished",
  "createdAt": "2026-10-26T12:00:00Z",
  "updatedAt": "2026-10-26T12:00:00Z"
}
```

Choose a format from `Essay`, `Video`, `Project`, `Notes`, and `Other`, and a status of `draft` or `finished`. Use one `subject` string. Set `resourceId` to an existing resource ID or use `null` for independent work.

Put published writing in `content`. Use `url` for an HTTP or HTTPS link to a video, project, or a file hosted elsewhere, including this repository on GitHub. Either field can be an empty string.

## Validation and origin

The browser imports the library JSON through [src/library.ts](../src/library.ts). The [data model](../src/model.ts) validates the complete object and checks links from practice entries to resource IDs. The [command-line validator](../scripts/validate-data.mjs) uses the same function. It exits with an error when the file is unreadable, invalid JSON, or violates the data contract.

The first seven resources came from the original curriculum. Their IDs, titles, authors, links, and tiers were retained. The restoration started with zero recorded progress and an empty practice list because the source contained resource records alone. Creation timestamps on the restored entries record when they entered the published catalog, and update timestamps record later edits. [Original curriculum](https://github.com/KianBahasadri/kian-academy/blob/7642e74/js/curriculum.js)
