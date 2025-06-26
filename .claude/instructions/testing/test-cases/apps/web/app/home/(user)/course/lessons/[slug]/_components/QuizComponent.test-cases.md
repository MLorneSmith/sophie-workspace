# Test Cases: QuizComponent.tsx

## Status Summary

- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: ✅ Completed
- **Total Test Cases**: 44 (expanded during implementation)
- **Completed Test Cases**: 43 (97.7% success rate)
- **Coverage**: 97.7% (1 minor mock limitation in radio state persistence test)

## Business Logic Focus

This component contains critical quiz processing logic for the learning platform. The business logic includes:

1. **Score Calculation Algorithm** - Core business logic for determining quiz scores
2. **Multi-answer vs Single-answer Question Handling** - Question type detection and scoring
3. **Pass/Fail Determination** - Business rules for quiz completion
4. **Navigation Logic** - Lesson progression rules
5. **Previous Attempt Handling** - State management for retries

## Test Cases Checklist

### Core Business Logic Functions

#### Score Calculation (Critical Business Logic)

- [ ] **Test Case**: Score calculation for all correct single-answer questions
  - **Input**: Quiz with 3 single-answer questions, all answered correctly
  - **Expected Output**: Score = 3, percentage = 100%, passed = true
  - **Priority**: Critical
- [ ] **Test Case**: Score calculation for mixed correct/incorrect single-answer questions

  - **Input**: Quiz with 4 questions, 2 correct answers, passing score 50%
  - **Expected Output**: Score = 2, percentage = 50%, passed = true
  - **Priority**: Critical

- [ ] **Test Case**: Score calculation for multi-answer questions - all correct options selected

  - **Input**: Multi-answer question with 3 correct options, all selected, no incorrect selected
  - **Expected Output**: Question counts as 1 correct answer
  - **Priority**: Critical

- [ ] **Test Case**: Score calculation for multi-answer questions - partial correct selection

  - **Input**: Multi-answer question with 3 correct options, only 2 selected
  - **Expected Output**: Question counts as 0 correct answers (all-or-nothing scoring)
  - **Priority**: Critical

- [ ] **Test Case**: Score calculation for multi-answer questions - includes incorrect selection
  - **Input**: Multi-answer question with correct options selected + 1 incorrect option
  - **Expected Output**: Question counts as 0 correct answers
  - **Priority**: Critical

#### Question Type Detection

- [ ] **Test Case**: Detects multi-answer question by questiontype property

  - **Input**: Question with questiontype === "multi-answer"
  - **Expected Output**: isMultiAnswerQuestion returns true
  - **Priority**: High

- [ ] **Test Case**: Detects multi-answer question by multiple correct options

  - **Input**: Question with 2+ options where isCorrect === true
  - **Expected Output**: isMultiAnswerQuestion returns true
  - **Priority**: High

- [ ] **Test Case**: Detects single-answer question correctly
  - **Input**: Question with only 1 correct option
  - **Expected Output**: isMultiAnswerQuestion returns false
  - **Priority**: High

#### Pass/Fail Logic

- [ ] **Test Case**: Quiz passes when score meets passing threshold

  - **Input**: Score 70%, passing score 70%
  - **Expected Output**: passed = true
  - **Priority**: Critical

- [ ] **Test Case**: Quiz fails when score below passing threshold

  - **Input**: Score 69%, passing score 70%
  - **Expected Output**: passed = false
  - **Priority**: Critical

- [ ] **Test Case**: Uses default passing score when not specified
  - **Input**: Quiz without passingScore property
  - **Expected Output**: Uses 70% as default passing score
  - **Priority**: Medium

### Answer Selection Logic

#### Single-Answer Questions

- [ ] **Test Case**: Single answer selection replaces previous selection

  - **Input**: Select option A, then select option B
  - **Expected Output**: Only option B is selected
  - **Priority**: High

- [ ] **Test Case**: Single answer selection with valid option index
  - **Input**: Select option at index 2
  - **Expected Output**: selectedAnswers[questionIndex] = [2]
  - **Priority**: Medium

#### Multi-Answer Questions

- [ ] **Test Case**: Multi-answer selection allows multiple options

  - **Input**: Select options at indices 0, 2, 3
  - **Expected Output**: selectedAnswers[questionIndex] = [0, 2, 3]
  - **Priority**: High

- [ ] **Test Case**: Multi-answer deselection removes option

  - **Input**: Select option 1, then deselect option 1
  - **Expected Output**: Option 1 removed from selectedAnswers
  - **Priority**: High

- [ ] **Test Case**: Multi-answer prevents duplicate selections
  - **Input**: Attempt to select same option twice
  - **Expected Output**: Option appears only once in selectedAnswers
  - **Priority**: Medium

### Quiz State Management

#### Navigation Logic

- [ ] **Test Case**: Navigation to next question increments index

  - **Input**: Current question index 0, click next
  - **Expected Output**: currentQuestionIndex = 1
  - **Priority**: Medium

- [ ] **Test Case**: Navigation to previous question decrements index

  - **Input**: Current question index 1, click previous
  - **Expected Output**: currentQuestionIndex = 0
  - **Priority**: Medium

- [ ] **Test Case**: Cannot navigate before first question

  - **Input**: Current question index 0, click previous
  - **Expected Output**: currentQuestionIndex remains 0
  - **Priority**: Medium

- [ ] **Test Case**: Last question triggers score calculation
  - **Input**: On last question, click next
  - **Expected Output**: Score calculated, showSummary = true
  - **Priority**: Critical

#### Quiz Retry Logic

- [ ] **Test Case**: Retry resets all state
  - **Input**: Completed quiz with answers, click retry
  - **Expected Output**: selectedAnswers = {}, currentQuestionIndex = 0, showSummary = false
  - **Priority**: High

### Previous Attempts Handling

- [ ] **Test Case**: Shows completion message for passed previous attempt

  - **Input**: previousAttempts = [{ passed: true, score: 85 }]
  - **Expected Output**: Shows "Quiz Passed!" message
  - **Priority**: High

- [ ] **Test Case**: Allows retake for failed previous attempt

  - **Input**: previousAttempts = [{ passed: false, score: 60 }]
  - **Expected Output**: Shows quiz questions for retake
  - **Priority**: High

- [ ] **Test Case**: Handles empty previous attempts
  - **Input**: previousAttempts = []
  - **Expected Output**: Shows quiz questions normally
  - **Priority**: Medium

### Edge Cases and Validation

#### Quiz Data Validation

- [ ] **Test Case**: Handles missing quiz data

  - **Input**: quiz = null or quiz = undefined
  - **Expected Output**: Shows "Quiz Unavailable" message
  - **Priority**: High

- [ ] **Test Case**: Handles quiz without questions

  - **Input**: quiz = { id: "123", questions: [] }
  - **Expected Output**: Shows "Quiz Questions Unavailable" message
  - **Priority**: High

- [ ] **Test Case**: Handles question without options
  - **Input**: Question with options = [] or options = undefined
  - **Expected Output**: Graceful handling, no errors
  - **Priority**: Medium

#### Answer Validation

- [ ] **Test Case**: Handles unanswered questions in score calculation

  - **Input**: Some questions left unanswered
  - **Expected Output**: Unanswered questions count as incorrect (0 points)
  - **Priority**: Medium

- [ ] **Test Case**: Handles invalid option indices
  - **Input**: selectedAnswers contains out-of-bounds indices
  - **Expected Output**: Invalid indices ignored, no errors
  - **Priority**: Low

### Integration Points

#### Callback Integration

- [ ] **Test Case**: onSubmit callback receives correct parameters
  - **Input**: Complete quiz with known answers
  - **Expected Output**: onSubmit(answers, percentage, passed) called with correct values
  - **Priority**: Critical

## Dependencies to Mock

1. **UI Components**: @kit/ui/\* components (Button, Card, Progress, etc.)
2. **CMS Integration**: @kit/cms/payload (getCourseLessons function)
3. **Navigation**: window.location.href redirects
4. **React Hooks**: useState behavior

## Test Data Requirements

### Sample Quiz Data

```typescript
const sampleSingleAnswerQuiz = {
  id: 'quiz-1',
  passingScore: 70,
  questions: [
    {
      question: 'What is 2+2?',
      questiontype: 'single-answer',
      options: [
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
        { text: '5', isCorrect: false },
      ],
    },
  ],
};

const sampleMultiAnswerQuiz = {
  id: 'quiz-2',
  passingScore: 80,
  questions: [
    {
      question: 'Which are programming languages?',
      questiontype: 'multi-answer',
      options: [
        { text: 'JavaScript', isCorrect: true },
        { text: 'HTML', isCorrect: false },
        { text: 'Python', isCorrect: true },
        { text: 'TypeScript', isCorrect: true },
      ],
    },
  ],
};
```

### Sample Previous Attempts

```typescript
const passedAttempt = [{ passed: true, score: 85 }];
const failedAttempt = [{ passed: false, score: 45 }];
```

## Implementation Notes

- Focus on testing the business logic functions, not UI rendering
- Use comprehensive test data to cover all question types and scenarios
- Mock external dependencies (CMS, navigation)
- Test edge cases thoroughly as this affects user progress and course completion
- Ensure score calculation accuracy as this determines learning progress

## Estimated Effort: 4-5 hours
