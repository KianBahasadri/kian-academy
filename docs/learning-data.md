# Learning data

[The published library](../data/library.json) holds the discipline definitions and two collections. Resources are material Kian learns from. Practice is Kian's own work, including writing, videos, and projects. Everything in the file is public, including practice drafts. For the release process, see [Publishing](publishing.md).

Use `version: 1` and keep both `resources` and `practice` as arrays. Give each entry a nonempty `id` and `title`. IDs must be unique within their collection and should remain stable across edits. Use ISO 8601 for `createdAt` and `updatedAt`. The validator requires parseable date strings.

## Catalog commands

Run `./catalog` from the repository root using Python 3 on Linux or macOS and the repository’s Node.js version.

```sh
./catalog add "Thinking in Systems by Donella Meadows" "https://docs.python.org/3/tutorial/"
./catalog complete --dry-run feeling-good
./catalog complete feeling-good
```

**Add** accepts a title, ISBN, or URL, plus any progress you explicitly report on that line. It researches each item with OpenCode Go using DeepSeek V4.1 Flash at maximum reasoning effort. It reports duplicates and unresolved items and prints elapsed time every 15 seconds while waiting. For first-time setup, run `opencode`, enter `/connect`, and select OpenCode Go. [Go setup](https://opencode.ai/docs/console/go/)

**Complete** matches existing resources locally by ID, full title (case-insensitive), ISBN-13, or exact resource URL. It sets status to `completed`, progress to 100, and updates the modification time. Already-completed entries are skipped. An unknown or ambiguous input stops the whole batch before saving. Published completions count toward tier prerequisites.

Both commands accept several quoted arguments, piped input, or one resource per line pasted into the terminal and finished with Ctrl-D. Use `--dry-run` after the command name to preview. Start with a clean catalog to publish. The script validates the full catalog, commits changed entries together on `main`, runs the build and tests, then pushes to `origin`. Previews and batches with no changes skip publication.

## Resources

```json
{
  "id": "my-resource",
  "title": "The title of a book or course",
  "creator": "Its author or creator",
  "format": "Book",
  "tier": 2,
  "subjects": ["Mathematics", "Physics"],
  "areas": ["Linear algebra"],
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
| 1 | You can start here on your own, without prior study or a university background. |
| 2 | You have seen the basic ideas before and recognize the main terms. |
| 3 | You understand the core concepts and have read about related topics. |
| 4 | You know the field well and can apply its methods to unfamiliar problems. |
| 5 | You already know the research questions and techniques of the specific specialty this resource covers. |

### Readiness and progress

Store `planned` with progress 0 for an unstarted resource, `learning` with 0–99, or `completed` with 100. Only record activity Kian reports. The site calculates **Prerequisites needed** or **To learn** for unstarted resources. It preserves published progress on started and completed resources.

The first subject is the primary discipline for both earning and using credit. The top-level `disciplines` object maps each discipline to its list of at least four distinct foundational areas. For example, a Mathematics definition might include Linear algebra, Calculus, Geometry, and Probability. Define these once per discipline. Reuse their exact names when adding resources.

- Set `overview: true` only for a Tier I introduction spanning its primary discipline.
- On Tier II and III resources, list the discipline’s foundational `areas` substantively covered. Omit the field when none apply.
- On Tier IV, assign a `specialty` if the resource covers a specific specialty. Tier V requires the exact specialty name. Reuse the same spelling for matching resources in that discipline.

Only completed entries in the target’s primary discipline count. Tier I is open. Tier II needs two Tier I completions, including a discipline overview. Tier III also needs three Tier II completions covering two distinct areas. Tier IV adds four Tier III completions and requires four distinct areas across Tiers II and III. Tier V adds four Tier IV completions in the target’s specific specialty. All lower requirements carry forward. A resource can cover multiple areas but counts only once toward its tier quota.

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
