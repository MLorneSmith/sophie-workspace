import { CollectionConfig } from 'payload'
import { CourseLessons } from './CourseLessons'
import { CourseQuizzes } from './CourseQuizzes'
import { Courses } from './Courses'
import { Documentation } from './Documentation'
import { Downloads } from './Downloads'
import { Media } from './Media'
import { Posts } from './Posts'
import { QuizQuestions } from './QuizQuestions'
import { SurveyQuestions } from './SurveyQuestions'
import { SurveyResponses } from './SurveyResponses'
import { Surveys } from './Surveys'
import { Users } from './Users'

export const collections: CollectionConfig[] = [
  Courses,
  CourseLessons,
  CourseQuizzes,
  QuizQuestions,
  Surveys,
  SurveyQuestions,
  SurveyResponses,
  Documentation,
  Posts,
  Media,
  Downloads,
  Users,
]
