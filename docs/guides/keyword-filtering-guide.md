# Keyword Filtering User Guide

## Quick Start

The keyword filtering system helps you automatically hide unwanted posts from your RSS feeds. Follow this guide to set up and manage your keyword filters effectively.

## Accessing Keyword Settings

1. **Navigate to Settings**: Click the settings icon or go to `/departments`
2. **Find Keyword Section**: Scroll to the "키워드 필터링" (Keyword Filtering) section
3. **Start Managing**: Add, remove, or organize your blocked keywords

## Adding Keywords

### Single Keyword Addition

1. **Type Keyword**: Enter the keyword in the input field
2. **Press Enter** or click the "추가" (Add) button
3. **Confirmation**: You'll see a success message and the keyword appears as a red tag

### Bulk Import

1. **Click "가져오기"** (Import) button
2. **Enter Keywords**: Add multiple keywords in the modal:
   - One per line: `spam\npromotion\nadvertisement`
   - Comma-separated: `spam, promotion, advertisement`
   - Mixed format: `spam, promotion\nadvertisement`
3. **Import**: Click "가져오기" to add all keywords
4. **Review**: Check the success message for import count

## Managing Keywords

### Viewing Active Keywords
- **Settings Page**: See all keywords as removable tags
- **Main Feed**: View up to 3 active keywords in the filter bar
- **Statistics**: Check blocked post count and percentage

### Removing Keywords

#### Individual Removal
- **From Settings**: Click the ❌ button on any keyword tag
- **From Feed**: Click the ❌ button on filter bar keywords
- **Confirmation**: Success message confirms removal

#### Bulk Removal
- **Clear All**: Click "전체 삭제" (Clear All) in settings
- **Confirmation**: Confirms total keywords removed

### Exporting Keywords
1. **Click "내보내기"** (Export) button
2. **Automatic Copy**: Keywords copied to clipboard
3. **Fallback Download**: If clipboard fails, downloads as text file
4. **Format**: One keyword per line for easy sharing

## Understanding Filtering

### How It Works
- **Case Insensitive**: "SPAM" blocks "spam", "Spam", "SPAM"
- **Substring Matching**: "ad" blocks posts containing "advertisement", "ads", etc.
- **Multiple Fields**: Checks post title, description, and content
- **Real-time**: Applied immediately when keywords change

### What Gets Filtered
✅ **Post Title**: "🔥 SPAM Alert! Click here!"
✅ **Post Description**: "This is promotional content..."
✅ **Post Content**: Full article text (if available)

❌ **Not Filtered**: Author names, publication dates, categories

### Performance Impact
- **Fast Filtering**: Applied before other filters for speed
- **Memory Efficient**: Keywords stored optimally
- **Recommended Limit**: Under 50 keywords for best performance

## Visual Indicators

### Color Coding
- 🔴 **Red Tags**: Blocked keywords in settings and filter bar
- 🔵 **Blue Tags**: Other active filters (search, date)
- 📊 **Statistics**: Red-colored blocked post counter

### Filter Bar Integration
- **Active Keywords**: Shows up to 3 blocked keywords
- **Overflow Indicator**: "+N개 더" (N more) with settings link
- **Quick Removal**: One-click keyword deactivation

## Best Practices

### Effective Keyword Selection

#### ✅ Good Keywords
- **Specific Terms**: "promotion", "advertisement", "sponsored"
- **Common Spam Words**: "click here", "urgent", "limited time"
- **Unwanted Topics**: Subject-specific terms you want to avoid

#### ❌ Keywords to Avoid
- **Too Broad**: "the", "and", "is" (blocks everything)
- **Too Specific**: "advertisement_2024_12_01" (too narrow)
- **Personal Names**: May block legitimate content

### Organization Tips

#### Keyword Categories
- **Commercial**: spam, ads, promotion, sale, discount
- **Clickbait**: shocking, unbelievable, you won't believe
- **Inappropriate**: Based on your content preferences

#### Regular Maintenance
- **Weekly Review**: Check filtering statistics
- **Remove Outdated**: Delete expired promotional terms
- **Add New Terms**: Based on new spam patterns

## Advanced Usage

### Pattern Recognition
- **Seasonal Keywords**: Add holiday-specific spam terms
- **Trending Topics**: Block current buzzword spam
- **Multi-language**: Mix Korean and English terms as needed

### Import/Export Workflows

#### Backup Keywords
```
1. Export current keywords
2. Save text file as backup
3. Share with team members
4. Restore when needed
```

#### Team Sharing
```
1. One team member creates master list
2. Export and share keyword list
3. Team members import shared list
4. Customize individual additions
```

## Troubleshooting

### Keywords Not Working

#### Check Spelling
- Verify keyword spelling and spacing
- Remove extra whitespace characters
- Check for special characters

#### Test Filtering
1. Add a test keyword like "test123"
2. Look for posts containing that term
3. Verify they're filtered out
4. Remove test keyword when done

### Performance Issues

#### Too Many Keywords
- **Symptoms**: Slow feed loading, browser lag
- **Solution**: Reduce keywords to under 50
- **Alternative**: Use more specific, targeted terms

#### Browser Storage Full
- **Symptoms**: Keywords not saving
- **Solution**: Clear browser data or use fewer keywords
- **Prevention**: Regular cleanup of old keywords

### Missing Features

#### Regular Expressions
- **Current**: Simple substring matching only
- **Workaround**: Use multiple related keywords
- **Future**: Advanced pattern matching planned

#### Temporary Blocking
- **Current**: Permanent blocking only
- **Workaround**: Manual removal when no longer needed
- **Future**: Time-based blocking planned

## Getting Help

### Support Resources
- **Documentation**: Check `/docs` folder for technical details
- **Issue Tracker**: Report bugs on GitHub
- **Community**: Discuss with other users

### Common Questions

**Q: Can I use regular expressions?**
A: Not currently. Use multiple related keywords instead.

**Q: Do keywords work offline?**
A: Yes, keywords are stored locally and work without internet.

**Q: Is there a limit to keyword count?**
A: No hard limit, but performance degrades after ~100 keywords.

**Q: Can I share keywords with others?**
A: Yes, use the export/import feature to share keyword lists.

---

**Need More Help?**
- 📖 [Technical Documentation](./keyword-filtering.md)
- 🔧 [API Reference](../api/useKeywordFilter.md)
- 🐛 [Report Issues](https://github.com/your-repo/issues)