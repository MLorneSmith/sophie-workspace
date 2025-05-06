import { CollectionConfig } from 'payload'
import { CourseLessons } from './CourseLessons'
import { CourseQuizzes } from './CourseQuizzes'
import { Courses } from './Courses'
import { Documentation } from './Documentation'
import { Downloads } from './Downloads'
import { Posts } from './Posts'
import { Private } from './Private'
import { QuizQuestions } from './QuizQuestions'
import { SurveyQuestions } from './SurveyQuestions'
import { Surveys } from './Surveys'
import { Media } from './Media'
import { Users } from './Users'

export const collections: CollectionConfig[] = [
  Users,
  Media,
  Courses,
  CourseLessons,
  CourseQuizzes,
  QuizQuestions,
  Surveys,
  SurveyQuestions,
  Documentation,
  Posts,
  Private,
  Downloads,
]
