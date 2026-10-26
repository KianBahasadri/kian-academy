# Learning data

`library.json` is the source of truth for the public site. Edit it locally or through GitHub, then commit and push to `main`. A failed validation leaves the previous deployment online.

Keep `version` at `1`. Both `resources` and `practice` are arrays. IDs must be unique within each array and remain stable when you update an entry. Dates are ISO 8601 strings.

## Resource

```json
{
  "id": "my-resource",
  "title": "The title of a book or course",
  "creator": "Its author or creator",
  "format": "Book",
  "tier": 2,
  "subject": "Mathematics",
  "url": "https://example.com/book",
  "description": "What this resource covers.",
  "notes": "What I learned, understood, or still want to explore.",
  "status": "learning",
  "progress": 40,
  "createdAt": "2026-10-26T12:00:00Z",
  "updatedAt": "2026-10-26T12:00:00Z"
}
```

Formats: `Playlist`, `Course`, `Book`, `Textbook`, `Article`, `Other`.

`tier` is required and must be an integer from `1` to `5`. It follows the previous tier system, describing the intended audience and assumed knowledge independently of learning progress:

| Tier | Name | Meaning |
| --- | --- | --- |
| 1 | Entry point | For a general reader, with no prior study or university background and a manageable scope for independent learning. |
| 2 | Foundations | Builds on entry-level familiarity with the topic. |
| 3 | Intermediate | Assumes established foundations and broader relevant reading. |
| 4 | Advanced | Assumes substantial knowledge of the subject and its methods. |
| 5 | Specialist | Written for specialists in a narrow area, beyond general expertise in the wider discipline. |

Statuses: `planned` requires progress `0`; `learning` accepts integer progress `0`–`99`; `completed` requires `100`. The site displays these as To learn, In progress, and Completed. Subject is free text. Creator, URL, description, and notes can be empty strings. Use an HTTP(S) URL when present.

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

Formats: `Essay`, `Video`, `Project`, `Notes`, `Other`. Statuses: `draft`, `finished`. `resourceId` must match a resource in the same file, or be `null`. For videos and externally hosted work, set `url` to its public HTTP(S) link; `content` can describe it or be empty. You can also link to a Markdown file or project you publish in this repository using its GitHub URL. Both drafts and finished work are public when committed.

The examples above explain the format; they are not added to the live portfolio. Run `npm run validate:data` before pushing.
