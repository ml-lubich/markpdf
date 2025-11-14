---
pdf_options:
  format: a4
  margin: 30mm 25mm
  displayHeaderFooter: false
---

# Mermaid Charts Examples

This document demonstrates various types of Mermaid charts that can be rendered in markdown.

## 1. Flowchart

A simple flowchart showing a decision process:

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E{Found the issue?}
    E -->|Yes| F[Fix it]
    E -->|No| G[Ask for help]
    F --> C
    G --> C
    C --> H[End]
```

## 2. Sequence Diagram

A sequence diagram showing interaction between components:

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant Database

    User->>Browser: Enter URL
    Browser->>Server: HTTP Request
    Server->>Database: Query Data
    Database-->>Server: Return Results
    Server-->>Browser: HTTP Response
    Browser-->>User: Display Page
```

## 3. Gantt Chart

A project timeline using a Gantt chart:

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements Gathering    :a1, 2024-01-01, 10d
    Design Phase             :a2, after a1, 14d
    section Development
    Backend Development      :b1, after a2, 21d
    Frontend Development     :b2, after a2, 21d
    section Testing
    Unit Tests               :c1, after b1, 7d
    Integration Tests        :c2, after b2, 7d
    section Deployment
    Production Release       :d1, after c1 c2, 3d
```

## 4. Class Diagram

A class diagram showing object-oriented relationships:

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +boolean isIndoor
        +meow()
    }
    class Bird {
        +boolean canFly
        +fly()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat
    Animal <|-- Bird
```

## 5. State Diagram

A state diagram showing a simple state machine:

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start Task
    Processing --> Success: Task Complete
    Processing --> Error: Task Failed
    Success --> Idle: Reset
    Error --> Idle: Reset
    Idle --> [*]: Shutdown
```

## 6. Pie Chart

A pie chart showing data distribution:

```mermaid
pie title Programming Languages Usage
    "JavaScript" : 35
    "Python" : 25
    "Java" : 20
    "TypeScript" : 15
    "Other" : 5
```

## 7. Git Graph

A Git graph showing branch structure:

```mermaid
gitgraph
    commit id: "Initial"
    commit id: "Feature A"
    branch develop
    checkout develop
    commit id: "Dev Work 1"
    commit id: "Dev Work 2"
    checkout main
    commit id: "Hotfix"
    checkout develop
    commit id: "Dev Work 3"
    checkout main
    merge develop
    commit id: "Release"
```

## 8. Entity Relationship Diagram

An ER diagram showing database relationships:

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--|{ LINE-ITEM : "ordered in"
    CUSTOMER {
        string name
        string email
        int id
    }
    ORDER {
        int id
        date orderDate
        float total
    }
    PRODUCT {
        int id
        string name
        float price
    }
    LINE-ITEM {
        int quantity
        float subtotal
    }
```

## 9. User Journey

A user journey diagram:

```mermaid
journey
    title User Shopping Experience
    section Discovery
      Visit Website: 5: User
      Browse Products: 4: User
    section Selection
      Add to Cart: 5: User
      Review Cart: 4: User
    section Purchase
      Checkout: 5: User
      Payment: 3: User, System
      Confirmation: 5: User
```

## 10. Complex Flowchart

A more complex flowchart with multiple paths:

```mermaid
flowchart LR
    Start([Start]) --> Input[Input Data]
    Input --> Validate{Valid?}
    Validate -->|No| Error[Show Error]
    Validate -->|Yes| Process[Process Data]
    Error --> Input
    Process --> Save[Save to Database]
    Save --> Notify[Send Notification]
    Notify --> End([End])
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style Error fill:#FFB6C1
```

## 11. Quadrant Chart

A quadrant chart for prioritization:

```mermaid
quadrantChart
    title Project Prioritization
    x-axis Low Effort --> High Effort
    y-axis Low Value --> High Value
    quadrant-1 Should Do
    quadrant-2 Must Do
    quadrant-3 Won't Do
    quadrant-4 Nice to Have
    Feature A: [0.2, 0.8]
    Feature B: [0.6, 0.9]
    Feature C: [0.8, 0.3]
    Feature D: [0.3, 0.2]
```

## 12. Requirement Diagram

A requirement diagram showing system requirements:

```mermaid
requirementDiagram
    requirement FunctionalReq {
        id: 1
        text: System shall process payments
        risk: high
        verifymethod: test
    }
    requirement NonFunctionalReq {
        id: 2
        text: System shall respond within 2 seconds
        risk: medium
        verifymethod: test
    }
    element PaymentSystem {
        type: System
    }
    
    FunctionalReq - satisfies -> PaymentSystem
    NonFunctionalReq - satisfies -> PaymentSystem
```

## Conclusion

These examples demonstrate the variety of diagrams that can be created using Mermaid syntax in markdown files. Each chart type serves different purposes and can help visualize complex information in a clear and structured way.

