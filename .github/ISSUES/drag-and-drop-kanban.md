# Drag-and-drop status changes in Kanban view

## Description

Allow users to drag application cards between columns in the Kanban view to update their status.

## Suggested Implementation

- Use a library like `dnd-kit` or `@hello-pangea/dnd` for accessible drag-and-drop
- Update application status on drop via API call
- Provide visual feedback during drag (card shadow, column highlight)
- Support touch devices for mobile use

## Motivation

Drag-and-drop is the most intuitive way to interact with a Kanban board and would significantly improve the UX of the status management workflow.
